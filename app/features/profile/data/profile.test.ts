import { describe, expect, it } from 'vitest'
import { canTakeDiagnostic, isAdmin, isSuperAdmin, mapProfile, needsDiagnostic, toProfileUpdate } from './profile'

const row = {
  id: '6f1c2b0e-0000-4000-8000-000000000000',
  display_name: 'Ana',
  role: 'user',
  theme: null,
  locale: 'es',
  last_diagnostic_at: null,
  diagnostic_retake_allowed: false,
  created_at: '2026-09-25T00:00:00Z',
  updated_at: '2026-09-25T00:00:00Z',
}

describe('mapProfile', () => {
  it('maps a database row to the domain model', () => {
    expect(mapProfile(row)).toEqual({ id: row.id, displayName: 'Ana', role: 'user', theme: null, locale: 'es', lastDiagnosticAt: null, diagnosticRetakeAllowed: false })
  })

  it('rejects unknown values', () => {
    expect(() => mapProfile({ ...row, theme: 'neon' })).toThrow()
    expect(() => mapProfile({ ...row, role: 'superuser' })).toThrow()
  })
})

describe('toProfileUpdate', () => {
  it('only includes the given fields', () => {
    expect(toProfileUpdate({ theme: 'dark' })).toEqual({ theme: 'dark' })
    expect(toProfileUpdate({ displayName: 'Leo', locale: 'en' })).toEqual({ display_name: 'Leo', locale: 'en' })
  })
})

describe('isAdmin', () => {
  it('is true for admins and the super admin', () => {
    expect(isAdmin(mapProfile({ ...row, role: 'admin' }))).toBe(true)
    expect(isAdmin(mapProfile({ ...row, role: 'super_admin' }))).toBe(true)
    expect(isAdmin(mapProfile(row))).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})

describe('isSuperAdmin', () => {
  it('is true only for the super admin', () => {
    expect(isSuperAdmin(mapProfile({ ...row, role: 'super_admin' }))).toBe(true)
    expect(isSuperAdmin(mapProfile({ ...row, role: 'admin' }))).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
  })
})

describe('needsDiagnostic', () => {
  it('is true for users without a completed diagnostic', () => {
    expect(needsDiagnostic(mapProfile(row))).toBe(true)
    expect(needsDiagnostic(mapProfile({ ...row, last_diagnostic_at: '2026-09-26T00:00:00Z' }))).toBe(false)
  })

  it('exempts admins and missing profiles', () => {
    expect(needsDiagnostic(mapProfile({ ...row, role: 'admin' }))).toBe(false)
    expect(needsDiagnostic(mapProfile({ ...row, role: 'super_admin' }))).toBe(false)
    expect(needsDiagnostic(null)).toBe(false)
  })
})

describe('canTakeDiagnostic', () => {
  const done = { ...row, last_diagnostic_at: '2026-09-26T00:00:00Z' }

  it('allows only the first attempt', () => {
    expect(canTakeDiagnostic(mapProfile(row))).toBe(true)
    expect(canTakeDiagnostic(mapProfile(done))).toBe(false)
    expect(canTakeDiagnostic(null)).toBe(false)
  })

  it('allows another attempt when a developer enabled it', () => {
    expect(canTakeDiagnostic(mapProfile({ ...done, diagnostic_retake_allowed: true }))).toBe(true)
  })
})
