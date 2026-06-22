'use client'

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ActivityForm } from './ActivityForm'

export function ActivityModal({
  open,
  mode = 'create',
  activity = null,
  onClose,
  onSuccess,
  onPendingChange,
  busy = false,
}) {
  const title = mode === 'edit'
    ? 'Editar actividad'
    : mode === 'duplicate'
      ? 'Duplicar actividad'
      : 'Nueva actividad'
  const description = mode === 'edit'
    ? 'Corrige el nombre o ajusta cuándo se realiza.'
    : mode === 'duplicate'
      ? 'Conserva el nombre y elige las nuevas fechas.'
      : 'Define algo concreto que quieras cuidar.'

  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      className="relative z-[60]"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-900/45 backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0 motion-reduce:transition-none"
      />

      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            transition
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-lg transition duration-200 data-closed:translate-y-2 data-closed:scale-95 data-closed:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-brand-500 px-5 py-4 text-text-on-brand">
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold tracking-tight">
                  {title}
                </DialogTitle>
                <p className="mt-1 text-sm leading-relaxed text-brand-100">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label={`Cerrar ${title.toLocaleLowerCase('es-MX')}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-brand-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </button>
            </div>

            <ActivityForm
              key={`${mode}:${activity?.id ?? 'new'}`}
              mode={mode}
              initialActivity={activity}
              onCancel={onClose}
              onSuccess={onSuccess}
              onPendingChange={onPendingChange}
            />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export default ActivityModal
