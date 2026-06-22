'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { addActivity, editActivity } from '@/app/lib/actions'
import { Button } from '@/app/components/ui/Button'
import { DateWheelPicker } from '@/app/components/ui/DateWheelPicker'
import { cn } from '@/app/lib/cn'
import { toDateString } from '@/app/lib/dates'

const INITIAL_STATE = {
  status: 'idle',
  error: null,
}

const SCHEDULE_OPTIONS = [
  { label: 'Todos los días', value: 'daily' },
  { label: 'Un día', value: 'single' },
  { label: 'Entre fechas', value: 'range' },
]

const compactDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function todayAtMidnight() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

function dateFromString(value, fallback) {
  if (!value) return fallback
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function ActivityForm({
  mode = 'create',
  initialActivity = null,
  onCancel,
  onSuccess,
  onPendingChange,
}) {
  const today = useMemo(todayAtMidnight, [])
  const isEditing = mode === 'edit' && initialActivity
  const initialStart = mode === 'duplicate'
    ? today
    : dateFromString(initialActivity?.start_date, today)
  const initialEnd = mode === 'duplicate'
    ? today
    : dateFromString(initialActivity?.end_date, initialStart)
  const [scheduleType, setScheduleType] = useState(initialActivity?.schedule_type ?? 'daily')
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)
  const formAction = useMemo(
    () => isEditing ? editActivity.bind(null, initialActivity.id) : addActivity,
    [initialActivity?.id, isEditing]
  )
  const [state, action, pending] = useActionState(formAction, INITIAL_STATE)
  const minYear = Math.min(today.getFullYear(), startDate.getFullYear())
  const maxYear = today.getFullYear() + 10

  useEffect(() => {
    onPendingChange(pending)
    return () => onPendingChange(false)
  }, [onPendingChange, pending])

  useEffect(() => {
    if (state.status === 'success' && !pending) onSuccess()
  }, [onSuccess, pending, state.status])

  function chooseSchedule(nextType) {
    setScheduleType(nextType)

    if (nextType !== 'daily' && scheduleType === 'daily') {
      setStartDate(today)
      setEndDate(today)
    } else if (nextType === 'single') {
      setEndDate(startDate)
    } else if (nextType === 'range' && endDate < startDate) {
      setEndDate(startDate)
    }
  }

  function changeStartDate(nextDate) {
    setStartDate(nextDate)
    if (scheduleType !== 'daily' && endDate < nextDate) setEndDate(nextDate)
  }

  return (
    <form action={action} className="space-y-4 p-5">
      <div className="space-y-1.5">
        <label htmlFor="activity-name" className="block text-sm font-semibold text-text-primary">
          Nombre de la actividad
        </label>
        <input
          autoFocus
          id="activity-name"
          name="name"
          type="text"
          required
          maxLength={200}
          disabled={pending}
          defaultValue={initialActivity?.name ?? ''}
          placeholder="Ej: Tomar agua, meditar 10 min…"
          className="min-h-12 w-full rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary focus:border-brand-400 focus:outline-2 focus:outline-brand-500 disabled:opacity-50"
        />
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-semibold text-text-primary">
          ¿Cuándo se realiza?
        </legend>
        <input type="hidden" name="schedule_type" value={scheduleType} />
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
          {SCHEDULE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseSchedule(value)}
              disabled={pending}
              aria-pressed={scheduleType === value}
              className={cn(
                'min-h-11 rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-brand-500 sm:text-sm',
                scheduleType === value
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-text-secondary hover:bg-white hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <input type="hidden" name="start_date" value={toDateString(startDate)} />
      <input
        type="hidden"
        name="end_date"
        value={scheduleType === 'daily' ? '' : toDateString(scheduleType === 'single' ? startDate : endDate)}
      />

      {scheduleType === 'daily' ? (
        <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-sm leading-relaxed text-brand-700">
          Aparecerá desde {compactDateFormatter.format(startDate)} hasta que la pauses.
        </p>
      ) : null}

      {scheduleType === 'single' ? (
        <div className="animate-slide-up space-y-1.5 motion-reduce:animate-none">
          <p id="single-date-label" className="text-sm font-semibold text-text-primary">
            Fecha de la actividad
          </p>
          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card px-2 py-2.5 shadow-xs sm:px-3">
            <DateWheelPicker
              value={startDate}
              onChange={changeStartDate}
              disabled={pending}
              minYear={minYear}
              maxYear={maxYear}
              size="sm"
              locale="es-MX"
              aria-labelledby="single-date-label"
            />
          </div>
        </div>
      ) : null}

      {scheduleType === 'range' ? (
        <div className="animate-slide-up overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-xs motion-reduce:animate-none">
          <div className="border-b border-border-subtle px-3 py-2.5">
            <p className="text-sm font-semibold text-text-primary">Cada día del rango</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Desde {compactDateFormatter.format(startDate)} hasta {compactDateFormatter.format(endDate)}
            </p>
          </div>

          <div className="grid divide-y divide-border-subtle">
            <div className="grid grid-cols-[4.25rem_1fr] items-center gap-1 px-2 py-1.5 sm:px-3">
              <div>
                <p id="range-start-label" className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">
                  Desde
                </p>
                <p className="mt-1 text-xs tabular-nums text-text-tertiary">
                  {toDateString(startDate)}
                </p>
              </div>
              <DateWheelPicker
                value={startDate}
                onChange={changeStartDate}
                disabled={pending}
                minYear={minYear}
                maxYear={maxYear}
                size="xs"
                locale="es-MX"
                aria-labelledby="range-start-label"
              />
            </div>

            <div className="grid grid-cols-[4.25rem_1fr] items-center gap-1 px-2 py-1.5 sm:px-3">
              <div>
                <p id="range-end-label" className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">
                  Hasta
                </p>
                <p className="mt-1 text-xs tabular-nums text-text-tertiary">
                  {toDateString(endDate)}
                </p>
              </div>
              <DateWheelPicker
                value={endDate}
                onChange={setEndDate}
                disabled={pending}
                minYear={Math.min(today.getFullYear(), endDate.getFullYear())}
                maxYear={maxYear}
                size="xs"
                locale="es-MX"
                aria-labelledby="range-end-label"
              />
            </div>
          </div>
        </div>
      ) : null}

      {isEditing && initialActivity.start_date < toDateString(today) ? (
        <p className="rounded-xl bg-warning-light px-3 py-2.5 text-sm leading-relaxed text-warning">
          Si cambias la programación, el historial anterior se conservará y el ajuste comenzará hoy.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" fullWidth loading={pending} disabled={pending}>
          {isEditing ? 'Guardar cambios' : mode === 'duplicate' ? 'Crear copia' : 'Agregar'}
        </Button>
      </div>
    </form>
  )
}

export default ActivityForm
