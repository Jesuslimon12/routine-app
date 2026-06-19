const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const DAYS_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
]

export const APP_TIME_ZONE = 'America/Mexico_City'

const zonedDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(date = new Date()) {
  const parts = Object.fromEntries(
    zonedDateFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function isValidDateString(value) {
  if (typeof value !== 'string') return false

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/**
 * Returns "Viernes, 13 de junio" from "2026-06-13"
 */
export function formatDateSpanish(dateString) {
  // Parse without timezone shift
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayName = DAYS_ES[date.getDay()]
  const monthName = MONTHS_ES[month - 1]
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${day} de ${monthName}`
}

/**
 * Returns "junio 2026" from year=2026, month=6
 */
export function formatMonthYearSpanish(year, month) {
  return `${MONTHS_ES[month - 1].charAt(0).toUpperCase() + MONTHS_ES[month - 1].slice(1)} ${year}`
}

/**
 * Returns array of day objects for a 6-week calendar grid.
 * Each object: { date: "YYYY-MM-DD", isCurrentMonth: bool, dayNumber: number }
 * The grid starts on Monday (ISO week).
 */
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Day of week for first day (0=Sun → convert to Mon-based: Mon=0)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6 // Sunday becomes 6 (last)

  const days = []

  // Days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push({ date: toDateString(d), isCurrentMonth: false, dayNumber: d.getDate() })
  }

  // Days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d)
    days.push({ date: toDateString(date), isCurrentMonth: true, dayNumber: d })
  }

  // Fill to complete 6 rows (42 cells)
  let nextDay = 1
  while (days.length < 42) {
    const d = new Date(year, month, nextDay)
    days.push({ date: toDateString(d), isCurrentMonth: false, dayNumber: nextDay })
    nextDay++
  }

  return days
}

/**
 * Returns true if the given dateString is today.
 */
export function isToday(dateString) {
  return dateString === todayString()
}

/**
 * Returns true if dateString is in the past (before today).
 */
export function isPast(dateString) {
  return dateString < todayString()
}

/**
 * Returns true if dateString is in the future.
 */
export function isFuture(dateString) {
  return dateString > todayString()
}
