/**
 * Database query helpers using the Supabase JS client.
 * All functions accept the request-scoped Supabase server client first.
 */

/**
 * Fetches all active activities for a user on a specific date,
 * joined with their completion status for that date.
 *
 * Activities are included when the date falls inside their schedule.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<Array>}
 */
export async function getActivitiesForDay(supabase, userId, date) {
  const { data: allActivities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, schedule_type, start_date, end_date, created_at')
    .eq('user_id', userId)
    .lte('start_date', date)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .order('created_at', { ascending: true })

  if (activitiesError) throw activitiesError

  if (allActivities.length === 0) return []

  const activityIds = allActivities.map((a) => a.id)
  const [logsResult, pausesResult] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('activity_id')
      .eq('user_id', userId)
      .eq('log_date', date)
      .in('activity_id', activityIds),
    supabase
      .from('activity_pauses')
      .select('activity_id, paused_from, resumed_on')
      .eq('user_id', userId)
      .lte('paused_from', date)
      .in('activity_id', activityIds),
  ])

  if (logsResult.error) throw logsResult.error
  if (pausesResult.error) throw pausesResult.error

  const completedActivityIds = new Set(
    (logsResult.data ?? []).map((log) => log.activity_id)
  )
  const pausedActivityIds = new Set(
    (pausesResult.data ?? [])
      .filter((pause) => pause.resumed_on === null || pause.resumed_on > date)
      .map((pause) => pause.activity_id)
  )

  return allActivities
    .filter((activity) => (
      activity.schedule_type !== 'daily' || !pausedActivityIds.has(activity.id)
    ))
    .map((activity) => ({
      ...activity,
      completed: completedActivityIds.has(activity.id),
    }))
}

/**
 * Fetches the compact activity data used by the management drawer.
 * Paused activities include the start date of their current open pause.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getActivitiesForManager(supabase, userId) {
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, schedule_type, start_date, end_date, is_active, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (activitiesError) throw activitiesError

  const inactiveIds = (activities ?? [])
    .filter((activity) => !activity.is_active)
    .map((activity) => activity.id)

  if (inactiveIds.length === 0) return activities ?? []

  const { data: pauses, error: pausesError } = await supabase
    .from('activity_pauses')
    .select('activity_id, paused_from')
    .eq('user_id', userId)
    .is('resumed_on', null)
    .in('activity_id', inactiveIds)

  if (pausesError) throw pausesError

  const pausedFromByActivity = new Map(
    (pauses ?? []).map((pause) => [pause.activity_id, pause.paused_from])
  )

  return (activities ?? []).map((activity) => ({
    ...activity,
    paused_from: pausedFromByActivity.get(activity.id) ?? null,
  }))
}

/**
 * Returns an array of day-of-month numbers that have any activity log
 * or daily note for the given user in the given month.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Promise<number[]>}
 */
export async function getMonthDatesWithRecords(supabase, userId, year, month) {
  const paddedMonth = String(month).padStart(2, '0')
  const startDate = `${year}-${paddedMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`

  const [logsResult, notesResult] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('log_date')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate),
    supabase
      .from('daily_notes')
      .select('note_date')
      .eq('user_id', userId)
      .gte('note_date', startDate)
      .lte('note_date', endDate),
  ])

  if (logsResult.error) throw logsResult.error
  if (notesResult.error) throw notesResult.error

  const daySet = new Set()

  for (const row of logsResult.data ?? []) {
    daySet.add(new Date(row.log_date + 'T00:00:00').getDate())
  }
  for (const row of notesResult.data ?? []) {
    daySet.add(new Date(row.note_date + 'T00:00:00').getDate())
  }

  return Array.from(daySet).sort((a, b) => a - b)
}

/**
 * Upserts a daily note for the user on a specific date.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} date - "YYYY-MM-DD"
 * @param {{ mood_morning?: string, mood_evening?: string, note_text?: string }} data
 * @returns {Promise<object>}
 */
export async function upsertNote(supabase, userId, date, data) {
  const { error } = await supabase
    .from('daily_notes')
    .upsert(
      {
        user_id: userId,
        note_date: date,
        mood_morning: data.mood_morning ?? null,
        mood_evening: data.mood_evening ?? null,
        note_text: data.note_text ?? null,
      },
      { onConflict: 'user_id,note_date' }
    )

  if (error) throw error
}

/**
 * Upserts an activity completion log for a specific user, activity, and date.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} activityId
 * @param {string} date - "YYYY-MM-DD"
 * @param {boolean} completed
 * @returns {Promise<object>}
 */
export async function toggleLog(supabase, userId, activityId, date, completed) {
  const query = completed
    ? supabase
        .from('activity_logs')
        .upsert(
          {
            user_id: userId,
            activity_id: activityId,
            log_date: date,
            completed: true,
          },
          { onConflict: 'user_id,activity_id,log_date' }
        )
    : supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', userId)
        .eq('activity_id', activityId)
        .eq('log_date', date)

  const { error } = await query

  if (error) throw error
}
