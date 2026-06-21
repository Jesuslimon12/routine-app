'use client'

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Drawer({ open, onClose, busy = false, children }) {
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-900/35 backdrop-blur-[2px] transition-opacity duration-300 data-closed:opacity-0 motion-reduce:transition-none"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-lg transform transition duration-300 ease-out data-closed:translate-x-full motion-reduce:transition-none"
            >
              <div className="flex h-full flex-col overflow-hidden border-l border-border-default bg-surface-card shadow-lg">
                {children}
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export function DrawerHeader({ title, description, onClose, busy = false }) {
  return (
    <div className="shrink-0 border-b border-brand-700 bg-brand-500 px-5 py-5 text-text-on-brand sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <DialogTitle className="text-lg font-bold tracking-tight">
            {title}
          </DialogTitle>
          {description ? (
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-brand-100">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar gestor de actividades"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-brand-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function DrawerBody({ children }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-page px-4 py-5 sm:px-6 sm:py-6">
      {children}
    </div>
  )
}

export default Drawer
