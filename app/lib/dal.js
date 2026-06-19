import { redirect } from 'next/navigation'
import { getUser } from './session'
import {
  getActivitiesForDay,
  getActivitiesForManager,
  getMonthDatesWithRecords,
} from './db'

/**
 * Verifies the session and returns the current user.
 * Redirects to /login if the user is not authenticated.
 */
export async function verifySession(supabase) {
  const user = await getUser(supabase)
  if (!user) redirect('/login')
  return user
}

/**
 * Returns activities with their completion status + the daily note for a date.
 * Returns empty arrays/null when no records exist — never throws 404.
 *
 * @param {string} userId
 * @param {string} date - ISO date string "YYYY-MM-DD"
 * @returns {{ activities: Array, note: object|null }}
 */
export async function getDayData(supabase, userId, date) {
  const [activities, noteResult] = await Promise.all([
    getActivitiesForDay(supabase, userId, date),
    supabase
      .from('daily_notes')
      .select('id, note_date, mood_morning, mood_evening, note_text')
      .eq('user_id', userId)
      .eq('note_date', date)
      .maybeSingle(),
  ])

  if (noteResult.error) throw noteResult.error

  return {
    activities: activities ?? [],
    note: noteResult.data ?? null,
  }
}

/**
 * Returns an array of day-of-month numbers that have any log or note
 * for the given user/year/month. Used to render calendar indicators.
 *
 * @param {string} userId
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {number[]}
 */
export async function getMonthSummary(supabase, userId, year, month) {
  return getMonthDatesWithRecords(supabase, userId, year, month)
}

/**
 * Returns the active and paused activities needed by the management drawer.
 */
export async function getManagedActivities(supabase, userId) {
  return getActivitiesForManager(supabase, userId)
}
