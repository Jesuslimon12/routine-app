'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { formatDateSpanish, formatMonthYearSpanish, getCalendarDays, todayString } from '@/app/lib/dates'
import { cn } from '@/app/lib/cn'

const WEEKDAYS = [
  ['L', 'Lunes'], ['M', 'Martes'], ['M', 'Miércoles'], ['J', 'Jueves'],
  ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo'],
]

export function Calendar({ initialYear, initialMonth, selectedDate, daysWithData = [] }) {
  const router = useRouter()
  const today = todayString()
  const days = getCalendarDays(initialYear, initialMonth)
  const daysWithDataSet = new Set(daysWithData)
  const firstCurrentDate = days.find((day) => day.isCurrentMonth)?.date

  function navigate(year, month) {
    router.push(`/?${new URLSearchParams({ year: String(year), month: String(month) })}`)
  }

  function changeMonth(offset) {
    const date = new Date(initialYear, initialMonth - 1 + offset, 1)
    navigate(date.getFullYear(), date.getMonth() + 1)
  }

  function selectDay(date) {
    router.push(`/?${new URLSearchParams({
      date,
      year: String(initialYear),
      month: String(initialMonth),
    })}`)
  }

  function handleDayKeyDown(event, index) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const offset = offsets[event.key]
    if (!offset) return

    event.preventDefault()
    let nextIndex = index + offset
    while (days[nextIndex] && !days[nextIndex].isCurrentMonth) nextIndex += offset > 0 ? 1 : -1
    const nextDay = days[nextIndex]
    if (nextDay?.isCurrentMonth) {
      document.querySelector(`[data-calendar-date="${nextDay.date}"]`)?.focus()
    }
  }

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-4 shadow-sm sm:p-5" aria-label="Calendario">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
          className="flex size-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">Calendario</p>
          <h2 className="mt-0.5 text-base font-bold text-text-primary">{formatMonthYearSpanish(initialYear, initialMonth)}</h2>
        </div>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
          className="flex size-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7" role="row">
        {WEEKDAYS.map(([short, label]) => (
          <div key={label} className="py-1 text-center text-xs font-bold text-text-tertiary" aria-label={label}>
            {short}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-0.5" role="grid" aria-label={`Calendario de ${formatMonthYearSpanish(initialYear, initialMonth)}`}>
        {days.map((day, index) => {
          const hasData = day.isCurrentMonth && daysWithDataSet.has(day.dayNumber)
          const isSelected = day.date === selectedDate
          const isToday = day.date === today
          const isTabStop = isSelected || (!selectedDate && (isToday || day.date === firstCurrentDate))
          const ariaLabel = [
            formatDateSpanish(day.date),
            isToday ? 'hoy' : null,
            hasData ? 'con registros' : null,
          ].filter(Boolean).join(', ')

          return (
            <div key={day.date} role="gridcell" className="flex justify-center">
              <button
                type="button"
                disabled={!day.isCurrentMonth}
                onClick={() => selectDay(day.date)}
                onKeyDown={(event) => handleDayKeyDown(event, index)}
                aria-label={ariaLabel}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                tabIndex={day.isCurrentMonth && isTabStop ? 0 : -1}
                data-calendar-date={day.date}
                className={cn(
                  'relative flex size-11 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-brand-500',
                  !day.isCurrentMonth && 'cursor-default text-neutral-400 opacity-40',
                  day.isCurrentMonth && !isSelected && !isToday && 'text-text-primary hover:bg-neutral-100',
                  isToday && !isSelected && 'bg-brand-50 font-bold text-brand-700 ring-1 ring-brand-300',
                  isSelected && 'bg-brand-500 font-bold text-white hover:bg-brand-600',
                )}
              >
                <time dateTime={day.date}>{day.dayNumber}</time>
                {hasData && (
                  <span className={cn('absolute bottom-1 size-1 rounded-full', isSelected ? 'bg-white' : 'bg-success')} aria-hidden="true" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
