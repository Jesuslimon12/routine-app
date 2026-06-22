import test from 'node:test'
import assert from 'node:assert/strict'
import { loginSchema, registerSchema } from './auth-schemas.js'

const VALID_REGISTRATION = {
  email: 'persona@example.com',
  password: 'RutinaSegura12!',
  confirmPassword: 'RutinaSegura12!',
}

test('registerSchema accepts and normalizes a valid registration', () => {
  const result = registerSchema.parse({
    ...VALID_REGISTRATION,
    email: '  PERSONA@EXAMPLE.COM ',
  })

  assert.equal(result.email, 'persona@example.com')
})

test('registerSchema rejects every missing password category', () => {
  const invalidPasswords = [
    'CORTA1!',
    'SINMINUSCULAS12!',
    'sinmayusculas12!',
    'SinNumerosSeguro!',
    'SinSimbolos1234',
  ]

  for (const password of invalidPasswords) {
    const result = registerSchema.safeParse({
      ...VALID_REGISTRATION,
      password,
      confirmPassword: password,
    })

    assert.equal(result.success, false, password)
  }
})

test('registerSchema rejects a mismatched confirmation', () => {
  const result = registerSchema.safeParse({
    ...VALID_REGISTRATION,
    confirmPassword: 'OtraSegura123!',
  })

  assert.equal(result.success, false)
  assert.deepEqual(result.error.flatten().fieldErrors.confirmPassword, [
    'Las contraseñas no coinciden.',
  ])
})

test('loginSchema validates email without enforcing registration complexity', () => {
  const result = loginSchema.safeParse({
    email: 'persona@example.com',
    password: 'legacy-password',
  })

  assert.equal(result.success, true)
  assert.equal(loginSchema.safeParse({ email: 'correo-invalido', password: 'x' }).success, false)
})
