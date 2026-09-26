import { describe, expect, it } from 'vitest'
import { safeRedirect } from './access'
import { authErrorKey, toAuthResult } from './errors'
import { signInSchema, signUpSchema, updatePasswordSchema } from './schemas'

describe('safeRedirect', () => {
  it('accepts internal paths', () => {
    expect(safeRedirect('/courses?id=1')).toBe('/courses?id=1')
  })

  it('rejects external or invalid values', () => {
    expect(safeRedirect('https://evil.com')).toBe('/')
    expect(safeRedirect('//evil.com')).toBe('/')
    expect(safeRedirect('/\\evil.com')).toBe('/')
    expect(safeRedirect(['/a'])).toBe('/')
  })
})

describe('authErrorKey', () => {
  it('maps known codes and falls back to unknown', () => {
    expect(authErrorKey('invalid_credentials')).toBe('auth.errors.invalidCredentials')
    expect(authErrorKey('something_else')).toBe('auth.errors.unknown')
    expect(authErrorKey(undefined)).toBe('auth.errors.unknown')
  })

  it('builds results', () => {
    expect(toAuthResult(null)).toEqual({ ok: true })
    expect(toAuthResult({ code: 'weak_password' })).toEqual({ ok: false, errorKey: 'auth.errors.weakPassword' })
  })
})

describe('schemas', () => {
  it('trims and validates the email on sign in', () => {
    const result = signInSchema.safeParse({ email: '  a@b.co ', password: 'x' })
    expect(result.success && result.data.email).toBe('a@b.co')
    expect(signInSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })

  it('requires matching passwords of minimum length on sign up', () => {
    const base = { displayName: 'Ana', email: 'a@b.co', password: '12345678', passwordConfirm: '12345678' }
    expect(signUpSchema.safeParse(base).success).toBe(true)
    expect(signUpSchema.safeParse({ ...base, passwordConfirm: 'x' }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...base, password: '123', passwordConfirm: '123' }).success).toBe(false)
  })

  it('reports the mismatch on passwordConfirm', () => {
    const result = updatePasswordSchema.safeParse({ password: '12345678', passwordConfirm: '87654321' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['passwordConfirm'])
  })
})
