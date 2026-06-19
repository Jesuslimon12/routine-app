'use client'

import { useActionState, useEffect, useState } from 'react'
import { addActivity } from '@/app/lib/actions'
import { Button } from '@/app/components/ui/Button'
import { cn } from '@/app/lib/cn'

const INITIAL_STATE = {
  status: 'idle',
  error: null,
}

export function ActivityForm({ onCancel, onSuccess, onPendingChange }) {
  const [isRecurring, setIsRecurring] = useState(true)
  const [state, formAction, pending] = useActionState(addActivity, INITIAL_STATE)

  useEffect(() => {
    onPendingChange(pending)
    return () => onPendingChange(false)
  }, [onPendingChange, pending])

  useEffect(() => {
    if (state.status === 'success' && !pending) onSuccess()
  }, [onSuccess, pending, state.status])

  return (
    <form
      action={formAction}
      className="mb-6 space-y-5 rounded-2xl border border-brand-200 bg-surface-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
            Nueva actividad
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Define algo concreto que quieras cuidar.
          </p>
        </div>
      </div>

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
          placeholder="Ej: Tomar agua, meditar 10 min…"
          className="min-h-12 w-full rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary focus:border-brand-400 focus:outline-2 focus:outline-brand-500 disabled:opacity-50"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text-primary">
          ¿Con qué frecuencia?
        </legend>
        <input type="hidden" name="is_recurring" value={isRecurring ? 'true' : 'false'} />
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
          {[
            { label: 'Todos los días', value: true },
            { label: 'Fecha específica', value: false },
          ].map(({ label, value }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setIsRecurring(value)}
              disabled={pending}
              aria-pressed={isRecurring === value}
              className={cn(
                'min-h-11 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-500',
                isRecurring === value
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-text-secondary hover:bg-white hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {!isRecurring ? (
        <div className="animate-slide-up space-y-1.5 motion-reduce:animate-none">
          <label htmlFor="specific-date" className="block text-sm font-semibold text-text-primary">
            Fecha específica
          </label>
          <input
            id="specific-date"
            name="specific_date"
            type="date"
            required
            disabled={pending}
            className="min-h-12 w-full rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-base text-text-primary focus:border-brand-400 focus:outline-2 focus:outline-brand-500 disabled:opacity-50"
          />
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" fullWidth loading={pending} disabled={pending}>
          Agregar
        </Button>
      </div>
    </form>
  )
}

export default ActivityForm
