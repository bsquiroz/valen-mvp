import { describe, expect, it } from 'vitest'
import { isAdmin, mapProfile, toProfileUpdate } from './profile'

const row = {
  id: '6f1c2b0e-0000-4000-8000-000000000000',
  display_name: 'Ana',
  role: 'user',
  theme: null,
  locale: 'es',
  created_at: '2026-09-25T00:00:00Z',
  updated_at: '2026-09-25T00:00:00Z',
}

describe('mapProfile', () => {
  it('maps a database row to the domain model', () => {
    expect(mapProfile(row)).toEqual({ id: row.id, displayName: 'Ana', role: 'user', theme: null, locale: 'es' })
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
