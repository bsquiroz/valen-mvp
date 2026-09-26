import { describe, expect, it } from 'vitest'
import { adminErrorKey, adminPasswordSchema, createAdminSchema, mapAdminAccounts } from './admins'

describe('mapAdminAccounts', () => {
  it('maps rows from super_admin_list_admins', () => {
    const rows = [{ id: 'a', email: 'ana@x.co', display_name: 'Ana', created_at: '2026-09-26T00:00:00Z' }]
    expect(mapAdminAccounts(rows)).toEqual([{ id: 'a', email: 'ana@x.co', displayName: 'Ana', createdAt: '2026-09-26T00:00:00Z' }])
  })

  it('rejects malformed rows', () => {
    expect(() => mapAdminAccounts([{ id: 'a' }])).toThrow()
  })
})

describe('createAdminSchema', () => {
  const base = { displayName: ' Ana ', email: ' ana@x.co ', password: '12345678' }

  it('trims and validates', () => {
    const result = createAdminSchema.safeParse(base)
    expect(result.success && result.data).toEqual({ displayName: 'Ana', email: 'ana@x.co', password: '12345678' })
  })

  it('reports errors as i18n keys', () => {
    const result = createAdminSchema.safeParse({ ...base, email: 'nope', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toEqual(['auth.errors.emailInvalid', 'auth.errors.passwordMin'])
    }
  })
})

describe('adminPasswordSchema', () => {
  it('enforces length limits', () => {
    expect(adminPasswordSchema.safeParse({ password: '12345678' }).success).toBe(true)
    expect(adminPasswordSchema.safeParse({ password: 'x'.repeat(73) }).success).toBe(false)
  })
})

describe('adminErrorKey', () => {
  it('maps known codes and falls back to unknown', () => {
    expect(adminErrorKey('email_taken')).toBe('admins.errors.emailTaken')
    expect(adminErrorKey('whatever')).toBe('auth.errors.unknown')
    expect(adminErrorKey(undefined)).toBe('auth.errors.unknown')
  })
})
