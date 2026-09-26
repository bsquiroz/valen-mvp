import { describe, expect, it } from 'vitest'
import { formatDuration, parseDuration, roundedMinutes } from './duration'

describe('duration', () => {
  it('parses min:seg or plain minutes into seconds', () => {
    expect(parseDuration('14:54')).toBe(894)
    expect(parseDuration(' 5 ')).toBe(300)
    expect(parseDuration('0:45')).toBe(45)
  })

  it('rejects other formats and out of range values', () => {
    expect(parseDuration('14:60')).toBeNull()
    expect(parseDuration('14m')).toBeNull()
    expect(parseDuration('0:00')).toBeNull()
    expect(parseDuration('601')).toBeNull()
    expect(parseDuration('')).toBeNull()
  })

  it('formats seconds and rounds totals to minutes', () => {
    expect(formatDuration(894)).toBe('14:54')
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(3750)).toBe('1:02:30')
    expect(roundedMinutes(894)).toBe(15)
    expect(roundedMinutes(20)).toBe(1)
  })
})
