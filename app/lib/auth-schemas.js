import { z } from 'zod'

const EMAIL_MAX_LENGTH = 254
const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: '12 caracteres como mínimo', test: (value) => value.length >= 12 },
  { key: 'lowercase', label: 'Una letra minúscula', test: (value) => /\p{Ll}/u.test(value) },
  { key: 'uppercase', label: 'Una letra mayúscula', test: (value) => /\p{Lu}/u.test(value) },
  { key: 'number', label: 'Un número', test: (value) => /\p{N}/u.test(value) },
  { key: 'symbol', label: 'Un símbolo o signo de puntuación', test: (value) => /[\p{P}\p{S}]/u.test(value) },
]

const emailSchema = z
  .string({ error: 'Ingresa tu correo electrónico.' })
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, 'El correo es demasiado largo.')
  .email('Ingresa un correo válido.')

const registrationPasswordSchema = z
  .string({ error: 'Crea una contraseña.' })
  .min(12, 'Usa al menos 12 caracteres.')
  .max(PASSWORD_MAX_LENGTH, `Usa como máximo ${PASSWORD_MAX_LENGTH} caracteres.`)
  .regex(/\p{Ll}/u, 'Agrega al menos una letra minúscula.')
  .regex(/\p{Lu}/u, 'Agrega al menos una letra mayúscula.')
  .regex(/\p{N}/u, 'Agrega al menos un número.')
  .regex(/[\p{P}\p{S}]/u, 'Agrega al menos un símbolo o signo de puntuación.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Ingresa tu contraseña.' })
    .min(1, 'Ingresa tu contraseña.')
    .max(256, 'La contraseña es demasiado larga.'),
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: registrationPasswordSchema,
    confirmPassword: z.string({ error: 'Confirma tu contraseña.' }),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export function firstFieldErrors(error) {
  const fieldErrors = error.flatten().fieldErrors

  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages?.[0] ? [[field, messages[0]]] : []
    )
  )
}
