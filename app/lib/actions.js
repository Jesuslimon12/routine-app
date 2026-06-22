'use server'

import { redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import { headers } from 'next/headers'
import { verifySession } from './dal'
import { isValidDateString, todayString } from './dates'
import { createServerClient } from './supabase'
import { toggleLog, upsertNote } from './db'
import { consumeAuthRateLimit } from './auth-rate-limit'
import { firstFieldErrors, loginSchema, registerSchema } from './auth-schemas'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VALID_MOODS = new Set(['bad', 'ok', 'good', 'excellent'])
const VALID_SCHEDULE_TYPES = new Set(['daily', 'single', 'range'])
const NOTE_MAX_LENGTH = 5000

function failure(error, fieldErrors = {}) {
  return { status: 'error', error, fieldErrors }
}

function success() {
  return { status: 'success', error: null, fieldErrors: {} }
}

function reportActionError(context, error) {
  console.error(`[${context}]`, error)
}

function isDuplicateActivityError(error) {
  return error?.code === '23505' && error?.message?.includes('duplicate_activity')
}

function readActivitySchedule(formData) {
  const scheduleType = formData.get('schedule_type')?.toString()
  const startDate = formData.get('start_date')?.toString().trim()
  const submittedEndDate = formData.get('end_date')?.toString().trim() || null

  if (!VALID_SCHEDULE_TYPES.has(scheduleType) || !isValidDateString(startDate)) {
    return { error: 'Selecciona una programación válida.' }
  }

  const endDate = scheduleType === 'daily'
    ? null
    : scheduleType === 'single'
      ? startDate
      : submittedEndDate

  if (scheduleType === 'range' && (!isValidDateString(endDate) || endDate < startDate)) {
    return { error: 'La fecha final debe ser igual o posterior a la inicial.' }
  }

  return { scheduleType, startDate, endDate, error: null }
}

export async function loginAction(_previousState, formData) {
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return failure('Revisa los campos marcados.', firstFieldErrors(result.error))
  }

  const rateLimit = await consumeAuthRateLimit('login', result.data.email)

  if (rateLimit.unavailable) {
    return failure('No fue posible validar la solicitud. Inténtalo de nuevo en unos minutos.')
  }

  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60))
    return failure(`Demasiados intentos. Inténtalo de nuevo en ${minutes} min.`)
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return failure('No pudimos iniciar sesión. Verifica tus datos o confirma tu correo.')
  }

  redirect('/')
}

export async function registerAction(_previousState, formData) {
  const result = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!result.success) {
    return failure('Revisa los campos marcados.', firstFieldErrors(result.error))
  }

  const rateLimit = await consumeAuthRateLimit('register', result.data.email)

  if (rateLimit.unavailable) {
    return failure('No fue posible validar la solicitud. Inténtalo de nuevo en unos minutos.')
  }

  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60))
    return failure(`Demasiadas solicitudes. Inténtalo de nuevo en ${minutes} min.`)
  }

  const requestHeaders = await headers()
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const vercelSiteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null
  const localHost = requestHeaders.get('host')
  const localSiteUrl = process.env.NODE_ENV !== 'production' && localHost
    ? `http://${localHost}`
    : null
  const siteUrl = configuredSiteUrl || vercelSiteUrl || localSiteUrl

  if (!siteUrl) {
    reportActionError('registerAction', new Error('Missing NEXT_PUBLIC_SITE_URL.'))
    return failure('No pudimos crear la cuenta. Inténtalo de nuevo más tarde.')
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  })

  if (error) {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return success()
    }

    reportActionError('registerAction', error)
    return failure('No pudimos crear la cuenta. Inténtalo de nuevo más tarde.')
  }

  return success()
}

export async function logoutAction() {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    reportActionError('logoutAction', error)
    throw new Error('No fue posible cerrar la sesión.')
  }

  redirect('/login')
}

export async function toggleActivityCheck(activityId, date, completed) {
  if (
    !UUID_PATTERN.test(activityId ?? '')
    || !isValidDateString(date)
    || typeof completed !== 'boolean'
  ) {
    return failure('Datos de actividad inválidos.')
  }

  if (date !== todayString()) {
    return failure('Solo puedes marcar actividades del día de hoy.')
  }

  const supabase = await createServerClient()
  const user = await verifySession(supabase)
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id, schedule_type, start_date, end_date, is_active')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (activityError) {
    reportActionError('toggleActivityCheck:activity', activityError)
    return failure('No fue posible validar la actividad.')
  }

  if (!activity) {
    return failure('La actividad no existe o no te pertenece.')
  }

  const isScheduled = date >= activity.start_date
    && (activity.end_date === null || date <= activity.end_date)
  const isAvailable = activity.schedule_type !== 'daily' || activity.is_active

  if (!isScheduled || !isAvailable) {
    return failure('La actividad no está disponible para el día de hoy.')
  }

  try {
    await toggleLog(supabase, user.id, activityId, date, completed)
  } catch (error) {
    reportActionError('toggleActivityCheck:update', error)
    return failure('No fue posible actualizar la actividad.')
  }

  refresh()
  return success()
}

export async function addActivity(_previousState, formData) {
  const name = formData.get('name')?.toString().trim()
  const schedule = readActivitySchedule(formData)

  if (!name || name.length > 200) {
    return failure('El nombre debe tener entre 1 y 200 caracteres.')
  }

  if (schedule.error) {
    return failure(schedule.error)
  }

  if (schedule.startDate < todayString()) {
    return failure('La actividad debe comenzar hoy o en una fecha futura.')
  }

  const supabase = await createServerClient()
  await verifySession(supabase)
  const { error } = await supabase.rpc('create_activity', {
    p_name: name,
    p_schedule_type: schedule.scheduleType,
    p_start_date: schedule.startDate,
    p_end_date: schedule.endDate,
  })

  if (error) {
    reportActionError('addActivity', error)
    if (isDuplicateActivityError(error)) {
      return failure('Ya existe una actividad igual para esas fechas.')
    }
    return failure('No fue posible agregar la actividad.')
  }

  refresh()
  return success()
}

export async function editActivity(activityId, _previousState, formData) {
  if (!UUID_PATTERN.test(activityId ?? '')) {
    return failure('La actividad no es válida.')
  }

  const name = formData.get('name')?.toString().trim()
  const schedule = readActivitySchedule(formData)

  if (!name || name.length > 200) {
    return failure('El nombre debe tener entre 1 y 200 caracteres.')
  }

  if (schedule.error) {
    return failure(schedule.error)
  }

  const supabase = await createServerClient()
  await verifySession(supabase)
  const { error } = await supabase.rpc('edit_activity', {
    p_activity_id: activityId,
    p_name: name,
    p_schedule_type: schedule.scheduleType,
    p_start_date: schedule.startDate,
    p_end_date: schedule.endDate,
    p_effective_date: todayString(),
  })

  if (error) {
    reportActionError('editActivity', error)
    if (isDuplicateActivityError(error)) {
      return failure('Ya existe una actividad igual para esas fechas.')
    }
    return failure('No fue posible guardar los cambios de la actividad.')
  }

  refresh()
  return success()
}

export async function pauseActivity(activityId) {
  if (!UUID_PATTERN.test(activityId ?? '')) {
    return failure('La actividad no es válida.')
  }

  const supabase = await createServerClient()
  await verifySession(supabase)
  const { error } = await supabase.rpc('pause_activity', {
    p_activity_id: activityId,
    p_effective_date: todayString(),
  })

  if (error) {
    reportActionError('pauseActivity', error)
    return failure('No fue posible pausar la actividad.')
  }

  refresh()
  return success()
}

export async function resumeActivity(activityId) {
  if (!UUID_PATTERN.test(activityId ?? '')) {
    return failure('La actividad no es válida.')
  }

  const supabase = await createServerClient()
  await verifySession(supabase)
  const { error } = await supabase.rpc('resume_activity', {
    p_activity_id: activityId,
    p_effective_date: todayString(),
  })

  if (error) {
    reportActionError('resumeActivity', error)
    return failure('No fue posible reactivar la actividad.')
  }

  refresh()
  return success()
}

export async function saveNote(_previousState, formData) {
  const date = formData.get('date')?.toString().trim()
  const moodMorning = formData.get('mood_morning')?.toString().trim() || null
  const moodEvening = formData.get('mood_evening')?.toString().trim() || null
  const noteText = formData.get('note_text')?.toString().trim() || null

  if (!isValidDateString(date)) {
    return failure('Selecciona una fecha válida.')
  }

  if (moodMorning !== null && !VALID_MOODS.has(moodMorning)) {
    return failure('El ánimo de la mañana no es válido.')
  }

  if (moodEvening !== null && !VALID_MOODS.has(moodEvening)) {
    return failure('El ánimo de la tarde no es válido.')
  }

  if (noteText && noteText.length > NOTE_MAX_LENGTH) {
    return failure(`La nota no puede superar ${NOTE_MAX_LENGTH} caracteres.`)
  }

  const supabase = await createServerClient()
  const user = await verifySession(supabase)

  try {
    await upsertNote(supabase, user.id, date, {
      mood_morning: moodMorning,
      mood_evening: moodEvening,
      note_text: noteText,
    })
  } catch (error) {
    reportActionError('saveNote', error)
    return failure('No fue posible guardar la nota.')
  }

  refresh()
  return success()
}
