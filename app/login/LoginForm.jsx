'use client'

import { useActionState, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckIcon, EnvelopeIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { loginAction, registerAction } from '@/app/lib/actions'
import { PASSWORD_REQUIREMENTS } from '@/app/lib/auth-schemas'
import { Button } from '@/app/components/ui/Button'

const INITIAL_STATE = { status: 'idle', error: null, fieldErrors: {} }
const INPUT_CLASS =
  'min-h-12 w-full rounded-xl border bg-surface-card px-4 py-2.5 text-base text-text-primary ' +
  'placeholder:text-text-tertiary transition-colors duration-150 focus:outline-2 focus:outline-offset-0 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60'
const COMPACT_REQUIREMENT_LABELS = {
  length: '12 caracteres',
  lowercase: 'una minúscula',
  uppercase: 'una mayúscula',
  number: 'un número',
  symbol: 'un símbolo',
}
const SPANISH_LIST = new Intl.ListFormat('es', { style: 'short', type: 'conjunction' })

function AuthField({ id, label, error, hint, descriptionId, className = '', ...inputProps }) {
  const describedBy = [descriptionId, hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${INPUT_CLASS} ${error
            ? 'border-error pr-11 focus:border-error focus:outline-error'
            : 'border-border-default focus:border-brand-400 focus:outline-brand-500'} ${className}`}
          {...inputProps}
        />
        {error ? (
          <ExclamationCircleIcon
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-error"
          />
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm leading-5 text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FormError({ message }) {
  if (!message) return null

  return (
    <div role="alert" className="flex gap-2.5 rounded-xl border border-error/20 bg-error-light px-3.5 py-3 text-sm text-error">
      <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

function FormSuccess({ message }) {
  if (!message) return null

  return (
    <div role="status" className="flex gap-2.5 rounded-xl border border-success/20 bg-success-light px-3.5 py-3 text-sm text-success">
      <CheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

function SignInForm({ initialError, initialSuccess }) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE)
  const errors = state.fieldErrors || {}

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormSuccess message={initialSuccess} />

      <AuthField
        id="login-email"
        name="email"
        label="Correo electrónico"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={254}
        required
        disabled={pending}
        error={errors.email}
        placeholder="tu@correo.com"
      />

      <AuthField
        id="login-password"
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        maxLength={256}
        required
        disabled={pending}
        error={errors.password}
        placeholder="Ingresa tu contraseña"
      />

      <FormError message={state.error || initialError} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        disabled={pending}
      >
        {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}

function PasswordRequirements({ password }) {
  const missingRequirements = PASSWORD_REQUIREMENTS
    .filter((requirement) => !requirement.test(password))
    .map((requirement) => COMPACT_REQUIREMENT_LABELS[requirement.key])
  const isSecure = missingRequirements.length === 0

  return (
    <p
      id="register-password-requirements"
      aria-live="polite"
      className={`flex min-h-5 items-start gap-1.5 text-xs leading-5 ${
        isSecure ? 'font-semibold text-success' : 'text-text-secondary'
      }`}
    >
      {isSecure ? <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : null}
      <span>
        {isSecure
          ? 'Contraseña segura.'
          : `Faltan: ${SPANISH_LIST.format(missingRequirements)}.`}
      </span>
    </p>
  )
}

function RegistrationSuccess({ onBack }) {
  return (
    <div role="status" className="py-2 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-light text-success">
        <EnvelopeIcon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-5 text-xl font-bold text-text-primary">Revisa tu correo</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
        Enviamos un enlace para confirmar tu cuenta. Después de abrirlo podrás iniciar sesión.
      </p>
      <Button type="button" variant="secondary" size="md" className="mt-6" onClick={onBack}>
        Volver a iniciar sesión
      </Button>
    </div>
  )
}

function RegisterForm({ onBack }) {
  const [password, setPassword] = useState('')
  const [state, formAction, pending] = useActionState(registerAction, INITIAL_STATE)
  const errors = state.fieldErrors || {}

  if (state.status === 'success') {
    return <RegistrationSuccess onBack={onBack} />
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <AuthField
        id="register-email"
        name="email"
        label="Correo electrónico"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={254}
        required
        disabled={pending}
        error={errors.email}
        placeholder="tu@correo.com"
      />

      <AuthField
        id="register-password"
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={128}
        required
        disabled={pending}
        error={errors.password}
        descriptionId="register-password-requirements"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Crea una contraseña segura"
      />

      <PasswordRequirements password={password} />

      <AuthField
        id="register-confirm-password"
        name="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={128}
        required
        disabled={pending}
        error={errors.confirmPassword}
        placeholder="Repítela para confirmar"
      />

      <FormError message={state.error} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        disabled={pending}
      >
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  )
}

export function LoginForm({ initialError = null, initialSuccess = null }) {
  const [mode, setMode] = useState('login')
  const reduceMotion = useReducedMotion()
  const isLogin = mode === 'login'
  const motionProps = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }

  function selectMode(nextMode) {
    setMode(nextMode)
  }

  return (
    <div>
      <div aria-label="Acceso a la cuenta" className="mb-8 grid grid-cols-2 border-b border-border-default">
        {[
          { value: 'login', label: 'Iniciar sesión' },
          { value: 'register', label: 'Crear cuenta' },
        ].map((option) => {
          const selected = mode === option.value

          return (
            <button
              key={option.value}
              type="button"
              id={`${option.value}-tab`}
              aria-pressed={selected}
              onClick={() => selectMode(option.value)}
              className={`relative min-h-12 px-3 pb-3 text-sm font-semibold transition-colors focus-visible:outline-offset-0 ${
                selected ? 'text-brand-700' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {option.label}
              {selected ? <span aria-hidden="true" className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-500" /> : null}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={mode}
          id={`${mode}-panel`}
          {...motionProps}
        >
          <p className="mb-2 text-sm font-semibold text-brand-600">
            {isLogin ? 'Qué gusto verte' : 'Empieza tu bitácora'}
          </p>
          <h2 className="text-2xl font-bold text-text-primary">
            {isLogin ? 'Vuelve a tu rutina' : 'Crea tu cuenta'}
          </h2>
          <p className="mb-7 mt-2 text-base leading-6 text-text-secondary">
            {isLogin
              ? 'Continúa con las actividades que elegiste para ti.'
              : 'Solo necesitas un correo y una contraseña segura.'}
          </p>

          {isLogin ? (
            <SignInForm initialError={initialError} initialSuccess={initialSuccess} />
          ) : (
            <RegisterForm onBack={() => selectMode('login')} />
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  )
}
