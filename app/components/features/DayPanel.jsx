'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { formatDateSpanish } from '@/app/lib/dates'
import { ActivityCheckItem } from './ActivityCheckItem'
import { NoteForm } from './NoteForm'
import { cn } from '@/app/lib/cn'

const TABS = [
  { id: 'actividades', label: 'Actividades' },
  { id: 'notas', label: 'Notas' },
]

export function DayPanel({ activities = [], note, date, isToday, year, month }) {
  const [activeTab, setActiveTab] = useState('actividades')
  const router = useRouter()
  const completed = activities.filter((activity) => activity.completed).length
  const total = activities.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  function handleClose() {
    const params = new URLSearchParams({ year: String(year), month: String(month) })
    router.push(`/?${params.toString()}`)
  }

  function handleTabKeyDown(event, index) {
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    else return

    event.preventDefault()
    setActiveTab(TABS[nextIndex].id)
    document.getElementById(`tab-${TABS[nextIndex].id}`)?.focus()
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-sm">
      <div className="border-b border-border-subtle p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              {isToday ? 'Tu día de hoy' : 'Tu bitácora'}
            </p>
            <h2 className="text-2xl font-bold text-text-primary capitalize">
              {formatDateSpanish(date)}
            </h2>
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar fecha seleccionada"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {total === 0 ? 'Aún no hay actividades' : `${completed} de ${total} completadas`}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {total === 0 ? 'Crea una actividad para comenzar tu ritmo.' : progress === 100 ? 'Cerraste el día.' : 'Sigue a tu propio paso.'}
            </p>
          </div>
          {total > 0 && <span className="text-2xl font-bold tabular-nums text-success">{progress}%</span>}
        </div>

        {total > 0 && (
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso diario"
          >
            <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex border-b border-border-subtle px-3 sm:px-4" role="tablist" aria-label="Contenido del día">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={cn(
              'relative min-h-12 px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-500',
              activeTab === tab.id
                ? 'text-brand-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand-500'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        <div id="panel-actividades" role="tabpanel" aria-labelledby="tab-actividades" hidden={activeTab !== 'actividades'}>
          {!isToday && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning-light px-3 py-3 text-warning">
              <InformationCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="text-sm leading-relaxed">Solo puedes marcar actividades del día de hoy.</p>
            </div>
          )}

          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default bg-neutral-50 px-5 py-10 text-center">
              <p className="text-base font-semibold text-text-primary">Este día todavía está abierto.</p>
              <p className="mt-1 text-sm text-text-secondary">Usa “Nueva actividad” para definir qué quieres cuidar.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle" aria-label="Lista de actividades del día">
              {activities.map((activity) => (
                <li key={`${date}:${activity.id}`} className="py-2 first:pt-0 last:pb-0">
                  <ActivityCheckItem activity={activity} date={date} isToday={isToday} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="panel-notas" role="tabpanel" aria-labelledby="tab-notas" hidden={activeTab !== 'notas'}>
          <NoteForm key={date} initialNote={note} date={date} />
        </div>
      </div>
    </section>
  )
}

export default DayPanel
