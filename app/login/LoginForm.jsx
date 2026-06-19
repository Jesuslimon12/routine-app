'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/lib/actions'
import { Button } from '@/app/components/ui/Button'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
    status: 'idle',
    error: null,
  })

  return (
    <form action={formAction} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-text-primary"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          disabled={pending}
          className="min-h-12 w-full rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:border-brand-400 focus:outline-2 focus:outline-brand-500 focus:outline-offset-0 disabled:opacity-50"
          placeholder="tu@correo.com"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-text-primary"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="min-h-12 w-full rounded-xl border border-border-default bg-surface-card px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:border-brand-400 focus:outline-2 focus:outline-brand-500 focus:outline-offset-0 disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      {/* Error message */}
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-error-light px-3 py-2 text-sm text-error"
        >
          {state.error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={pending}
        disabled={pending}
      >
        {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
