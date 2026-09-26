import { describe, expect, it } from 'vitest'
import { isThemeName, resolveInitialTheme } from './themes'

describe('isThemeName', () => {
  it('accepts known themes', () => {
    expect(isThemeName('light')).toBe(true)
    expect(isThemeName('sand')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isThemeName('neon')).toBe(false)
    expect(isThemeName(null)).toBe(false)
  })
})

describe('resolveInitialTheme', () => {
  it('uses the stored theme when valid', () => {
    expect(resolveInitialTheme('sand', true)).toBe('sand')
  })

  it('falls back to the system preference', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark')
    expect(resolveInitialTheme('neon', false)).toBe('light')
  })
})
