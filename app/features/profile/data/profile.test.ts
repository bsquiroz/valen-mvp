import { describe, expect, it } from 'vitest'
import { isAdmin, mapProfile, needsDiagnostic, toProfileUpdate } from './profile'

const row = {
  id: '6f1c2b0e-0000-4000-8000-000000000000',
  display_name: 'Ana',
  role: 'user',
  theme: null,
  locale: 'es',
  last_diagnostic_at: null,
  created_at: '2026-09-25T00:00:00Z',
  updated_at: '2026-09-25T00:00:00Z',
}

describe('mapProfile', () => {
  it('maps a database row to the domain model', () => {
    expect(mapProfile(row)).toEqual({ id: row.id, displayName: 'Ana', role: 'user', theme: null, locale: 'es', lastDiagnosticAt: null })
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
  it('is true only for admins', () => {
    expect(isAdmin(mapProfile({ ...row, role: 'admin' }))).toBe(true)
    expect(isAdmin(mapProfile(row))).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})

describe('needsDiagnostic', () => {
  it('is true for users without a completed diagnostic', () => {
    expect(needsDiagnostic(mapProfile(row))).toBe(true)
    expect(needsDiagnostic(mapProfile({ ...row, last_diagnostic_at: '2026-09-26T00:00:00Z' }))).toBe(false)
  })

  it('exempts admins and missing profiles', () => {
    expect(needsDiagnostic(mapProfile({ ...row, role: 'admin' }))).toBe(false)
    expect(needsDiagnostic(null)).toBe(false)
  })
})
