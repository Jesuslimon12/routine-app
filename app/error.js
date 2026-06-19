'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-page px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-8 text-center shadow-sm"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <p className="mb-2 text-sm font-semibold text-brand-600">
          Algo salió mal
        </p>
        <h1 className="mb-3 text-2xl font-bold text-text-primary">
          No pudimos cargar tu rutina
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          Inténtalo nuevamente. Tus datos guardados no se perderán.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="min-h-11 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Reintentar
        </button>
      </div>
    </main>
  )
}
