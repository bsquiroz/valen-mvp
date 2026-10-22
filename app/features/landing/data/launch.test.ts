import { describe, expect, it } from 'vitest'
import { countdownParts, formatCop, pricePerSession, spotsSummary } from './launch'

const start = Date.parse('2026-11-09T19:00:00-05:00')

describe('countdownParts', () => {
  it('splits the remaining time into days, hours, minutes and seconds', () => {
    const now = start - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000) - 300
    expect(countdownParts(start, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
  })

  it('stays at zero once the start date has passed', () => {
    expect(countdownParts(start, start + 60_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('spotsSummary', () => {
  it('computes spots left and the taken percentage', () => {
    expect(spotsSummary(100, 73)).toEqual({ total: 100, taken: 73, left: 27, pct: 73 })
  })

  it('clamps taken spots between zero and the total', () => {
    expect(spotsSummary(100, 120)).toEqual({ total: 100, taken: 100, left: 0, pct: 100 })
    expect(spotsSummary(100, -5)).toEqual({ total: 100, taken: 0, left: 100, pct: 0 })
  })

  it('handles an empty generation', () => {
    expect(spotsSummary(0, 0).pct).toBe(0)
  })
})

describe('formatCop', () => {
  it('uses the locale thousands separator', () => {
    expect(formatCop(250000, 'es')).toBe('$250.000')
    expect(formatCop(250000, 'en')).toBe('$250,000')
  })

  it('rounds to whole pesos', () => {
    expect(formatCop(15625.4, 'es')).toBe('$15.625')
  })
})

describe('pricePerSession', () => {
  it('divides the price across the sessions', () => {
    expect(pricePerSession(250000, 16)).toBe(15625)
  })

  it('returns the full price when there are no sessions', () => {
    expect(pricePerSession(250000, 0)).toBe(250000)
  })
})
