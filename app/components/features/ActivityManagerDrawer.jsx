'use client'

import { useCallback, useState, useTransition } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { pauseActivity, resumeActivity } from '@/app/lib/actions'
import { formatDateSpanish } from '@/app/lib/dates'
import { Drawer, DrawerBody, DrawerHeader } from '@/app/components/drawer/Drawer'
import { ActivityModal } from './ActivityModal'

function scheduleLabel(activity) {
  if (activity.schedule_type === 'daily') return 'Todos los días'
  if (activity.schedule_type === 'single') {
    return `Un día: ${formatDateSpanish(activity.start_date)}`
  }
  return `${formatDateSpanish(activity.start_date)} — ${formatDateSpanish(activity.end_date)}`
}

function getActivityStatus(activity, today) {
  if (activity.schedule_type === 'daily') return activity.is_active ? 'active' : 'paused'
  if (activity.start_date > today) return 'upcoming'
  if (activity.end_date < today) return 'finished'
  return 'active'
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-11 shrink-0 place-items-center rounded-xl border border-border-default bg-white text-text-secondary transition-colors hover:bg-neutral-50 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function ActivityRow({
  activity,
  status,
  confirming,
  pending,
  error,
  onAskPause,
  onCancelPause,
  onPause,
  onResume,
  onEdit,
  onDuplicate,
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

  const isDaily = activity.schedule_type === 'daily'

  return (
    <li className="rounded-xl border border-border-default bg-surface-card p-4 shadow-xs">
      <div className="min-w-0">
        <p className="wrap-break-words font-semibold text-text-primary">{activity.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {status === 'paused' && activity.paused_from
            ? `Pausada desde ${formatDateSpanish(activity.paused_from)}`
            : scheduleLabel(activity)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {status !== 'finished' ? (
          <IconButton label={`Editar ${activity.name}`} onClick={onEdit} disabled={pending}>
            <PencilSquareIcon className="size-4" aria-hidden="true" />
          </IconButton>
        ) : null}

        <IconButton label={`Duplicar ${activity.name}`} onClick={onDuplicate} disabled={pending}>
          <DocumentDuplicateIcon className="size-4" aria-hidden="true" />
        </IconButton>

        {isDaily && status === 'active' ? (
          <button
            type="button"
            onClick={onAskPause}
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-error/25 bg-white px-3 text-sm font-semibold text-error transition-colors hover:bg-error-light disabled:opacity-50"
          >
            <PauseIcon className="size-4" aria-hidden="true" />
            Pausar
          </button>
        ) : null}

        {isDaily && status === 'paused' ? (
          <button
            type="button"
            onClick={onResume}
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-success-light px-3 text-sm font-semibold text-success transition-colors hover:brightness-95 disabled:opacity-50"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <PlayIcon className="size-4" aria-hidden="true" />
            )}
            Reactivar
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </li>
  )
}

function ActivityGroup({
  title,
  activities,
  collapsible = false,
  emptyMessage,
  renderActivity,
}) {
  const content = activities.length > 0 ? (
    <ul className="space-y-3">{activities.map(renderActivity)}</ul>
  ) : (
    <p className="px-2 py-4 text-sm text-text-secondary">{emptyMessage}</p>
  )

  if (collapsible) {
    return (
      <details className="group mt-5 rounded-2xl border border-border-default bg-surface-card open:shadow-xs">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-text-primary marker:content-none">
          <span>{title} <span className="font-normal text-text-tertiary">({activities.length})</span></span>
          <ChevronDownIcon className="size-5 text-text-tertiary transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-border-subtle p-3">{content}</div>
      </details>
    )
  }

  return (
    <section aria-labelledby="active-activities-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="active-activities-title" className="text-base font-bold text-text-primary">{title}</h2>
        <span className="text-sm text-text-tertiary">
          {activities.length} {activities.length === 1 ? 'actividad' : 'actividades'}
        </span>
      </div>
      {activities.length > 0 ? content : (
        <div className="rounded-xl border border-dashed border-border-default bg-surface-card px-4 py-7 text-center">
          <p className="font-semibold text-text-primary">No hay actividades activas.</p>
          <p className="mt-1 text-sm text-text-secondary">Crea una nueva o revisa las próximas.</p>
        </div>
      )}
    </section>
  )
}

export function ActivityManagerDrawer({ activities = [], today }) {
  const [open, setOpen] = useState(false)
  const [modalState, setModalState] = useState(null)
  const [formPending, setFormPending] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)
  const [pendingActivityIds, setPendingActivityIds] = useState([])
  const [rowErrors, setRowErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const groups = { active: [], upcoming: [], finished: [], paused: [] }
  for (const activity of activities) {
    groups[getActivityStatus(activity, today)].push(activity)
  }

  const busy = formPending || isPending || pendingActivityIds.length > 0

  const handleFormPendingChange = useCallback((pending) => {
    setFormPending(pending)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setStatusMessage(
      modalState?.mode === 'edit'
        ? 'Actividad actualizada.'
        : modalState?.mode === 'duplicate'
          ? 'Copia creada.'
          : 'Actividad agregada.'
    )
    setModalState(null)
  }, [modalState?.mode])

  function closeDrawer() {
    if (busy) return
    setOpen(false)
    setModalState(null)
    setConfirmingId(null)
    setRowErrors({})
    setStatusMessage('')
  }

  function openActivityModal(mode, activity = null) {
    setModalState({ mode, activity })
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

  function renderActivity(status) {
    return (activity) => (
      <ActivityRow
        key={activity.id}
        activity={activity}
        status={status}
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
        onResume={() => runActivityAction(activity, resumeActivity, 'Actividad reactivada.')}
        onEdit={() => openActivityModal('edit', activity)}
        onDuplicate={() => openActivityModal('duplicate', activity)}
      />
    )
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
          description="Crea, edita y organiza lo que forma parte de tus días."
          onClose={closeDrawer}
          busy={busy}
        />
        <DrawerBody>
          <div aria-live="polite" className="sr-only">{statusMessage}</div>

          <button
            type="button"
            onClick={() => openActivityModal('create')}
            className="mb-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Nueva actividad
          </button>

          {statusMessage ? (
            <p role="status" className="mb-5 rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
              {statusMessage}
            </p>
          ) : null}

          <ActivityGroup
            title="Activas"
            activities={groups.active}
            emptyMessage="No hay actividades activas."
            renderActivity={renderActivity('active')}
          />
          <ActivityGroup
            title="Próximas"
            activities={groups.upcoming}
            collapsible
            emptyMessage="No tienes actividades próximas."
            renderActivity={renderActivity('upcoming')}
          />
          <ActivityGroup
            title="Finalizadas"
            activities={groups.finished}
            collapsible
            emptyMessage="Todavía no hay actividades finalizadas."
            renderActivity={renderActivity('finished')}
          />
          <ActivityGroup
            title="Pausadas"
            activities={groups.paused}
            collapsible
            emptyMessage="No tienes actividades pausadas."
            renderActivity={renderActivity('paused')}
          />
        </DrawerBody>
      </Drawer>

      <ActivityModal
        open={modalState !== null}
        mode={modalState?.mode}
        activity={modalState?.activity}
        onClose={() => setModalState(null)}
        onSuccess={handleFormSuccess}
        onPendingChange={handleFormPendingChange}
        busy={formPending}
      />
    </>
  )
}

export default ActivityManagerDrawer
