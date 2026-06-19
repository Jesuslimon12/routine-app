'use client'

import { useCallback, useState, useTransition } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { pauseActivity, resumeActivity } from '@/app/lib/actions'
import { formatDateSpanish } from '@/app/lib/dates'
import { Drawer, DrawerBody, DrawerHeader } from '@/app/components/drawer/Drawer'
import { ActivityForm } from './ActivityForm'

function frequencyLabel(activity) {
  return activity.is_recurring
    ? 'Todos los días'
    : `Fecha específica: ${formatDateSpanish(activity.specific_date)}`
}

function ActivityRow({
  activity,
  confirming,
  pending,
  error,
  onAskPause,
  onCancelPause,
  onPause,
  onResume,
}) {
  if (confirming) {
    return (
      <li className="rounded-xl border border-error/25 bg-error-light p-4">
        <p className="font-semibold text-text-primary">
          ¿Pausar “{activity.name}” desde hoy?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          Su historial anterior se conservará.
        </p>
        {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancelPause}
            disabled={pending}
            className="min-h-11 rounded-xl border border-border-default bg-white px-3 text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onPause}
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-error px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
            Pausar
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="rounded-xl border border-border-default bg-surface-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-text-primary">{activity.name}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {activity.is_active
              ? frequencyLabel(activity)
              : activity.paused_from
                ? `Pausada desde ${formatDateSpanish(activity.paused_from)}`
                : 'Actividad pausada'}
          </p>
        </div>

        {activity.is_active ? (
          <button
            type="button"
            onClick={onAskPause}
            disabled={pending}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-error/25 bg-white px-3 text-sm font-semibold text-error transition-colors hover:bg-error-light disabled:opacity-50"
          >
            <PauseIcon className="size-4" aria-hidden="true" />
            Pausar
          </button>
        ) : (
          <button
            type="button"
            onClick={onResume}
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-success-light px-3 text-sm font-semibold text-success transition-colors hover:brightness-95 disabled:opacity-50"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <PlayIcon className="size-4" aria-hidden="true" />
            )}
            Reactivar
          </button>
        )}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </li>
  )
}

export function ActivityManagerDrawer({ activities = [] }) {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formPending, setFormPending] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)
  const [pendingActivityIds, setPendingActivityIds] = useState([])
  const [rowErrors, setRowErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeActivities = activities.filter((activity) => activity.is_active)
  const pausedActivities = activities.filter((activity) => !activity.is_active)
  const busy = formPending || isPending || pendingActivityIds.length > 0

  const handleFormPendingChange = useCallback((pending) => {
    setFormPending(pending)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setStatusMessage('Actividad agregada.')
  }, [])

  function closeDrawer() {
    if (busy) return
    setOpen(false)
    setShowForm(false)
    setConfirmingId(null)
    setRowErrors({})
    setStatusMessage('')
  }

  function runActivityAction(activity, action, successMessage) {
    setPendingActivityIds((current) =>
      current.includes(activity.id) ? current : [...current, activity.id]
    )
    setRowErrors((current) => ({ ...current, [activity.id]: null }))
    setStatusMessage('')

    startTransition(async () => {
      try {
        const result = await action(activity.id)
        if (result?.error) {
          setRowErrors((current) => ({ ...current, [activity.id]: result.error }))
        } else {
          setConfirmingId(null)
          setStatusMessage(successMessage)
        }
      } catch {
        setRowErrors((current) => ({
          ...current,
          [activity.id]: 'Ocurrió un error inesperado. Intenta de nuevo.',
        }))
      } finally {
        setPendingActivityIds((current) => current.filter((id) => id !== activity.id))
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Gestionar actividades"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-brand-500 sm:px-4"
      >
        <AdjustmentsHorizontalIcon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Gestionar actividades</span>
      </button>

      <Drawer open={open} onClose={closeDrawer} busy={busy}>
        <DrawerHeader
          title="Gestionar actividades"
          description="Agrega, pausa o reactiva lo que forma parte de tu rutina."
          onClose={closeDrawer}
          busy={busy}
        />
        <DrawerBody>
          <div aria-live="polite" className="sr-only">{statusMessage}</div>

          {showForm ? (
            <ActivityForm
              onCancel={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
              onPendingChange={handleFormPendingChange}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowForm(true)
                setStatusMessage('')
              }}
              className="mb-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:bg-brand-700"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Nueva actividad
            </button>
          )}

          {statusMessage ? (
            <p role="status" className="mb-5 rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
              {statusMessage}
            </p>
          ) : null}

          <section aria-labelledby="active-activities-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="active-activities-title" className="text-base font-bold text-text-primary">
                Activas
              </h2>
              <span className="text-sm text-text-tertiary">
                {activeActivities.length} {activeActivities.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>

            {activeActivities.length > 0 ? (
              <ul className="space-y-3">
                {activeActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    confirming={confirmingId === activity.id}
                    pending={pendingActivityIds.includes(activity.id)}
                    error={rowErrors[activity.id] ?? null}
                    onAskPause={() => {
                      setConfirmingId(activity.id)
                      setRowErrors((current) => ({ ...current, [activity.id]: null }))
                    }}
                    onCancelPause={() => {
                      setConfirmingId(null)
                      setRowErrors((current) => ({ ...current, [activity.id]: null }))
                    }}
                    onPause={() => runActivityAction(activity, pauseActivity, 'Actividad pausada.')}
                    onResume={() => {}}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border-default bg-surface-card px-4 py-7 text-center">
                <p className="font-semibold text-text-primary">No hay actividades activas.</p>
                <p className="mt-1 text-sm text-text-secondary">Crea una nueva o reactiva una actividad pausada.</p>
              </div>
            )}
          </section>

          <details className="group mt-6 rounded-2xl border border-border-default bg-surface-card open:shadow-xs">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-text-primary marker:content-none">
              <span>Pausadas <span className="font-normal text-text-tertiary">({pausedActivities.length})</span></span>
              <ChevronDownIcon className="size-5 text-text-tertiary transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-border-subtle p-3">
              {pausedActivities.length > 0 ? (
                <ul className="space-y-3">
                  {pausedActivities.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      confirming={false}
                      pending={pendingActivityIds.includes(activity.id)}
                      error={rowErrors[activity.id] ?? null}
                      onAskPause={() => {}}
                      onCancelPause={() => {}}
                      onPause={() => {}}
                      onResume={() => runActivityAction(activity, resumeActivity, 'Actividad reactivada.')}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-4 text-sm text-text-secondary">No tienes actividades pausadas.</p>
              )}
            </div>
          </details>
        </DrawerBody>
      </Drawer>
    </>
  )
}

export default ActivityManagerDrawer
