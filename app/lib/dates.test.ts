import { describe, expect, it } from 'vitest'
import { addIsoDays, localIsoDate } from './dates'

describe('dates', () => {
  it('formats local dates as ISO', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('adds days across months and years', () => {
    expect(addIsoDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addIsoDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})
