import { describe, expect, it } from 'vitest'
import { resolveInitialLocale } from './locales'

describe('resolveInitialLocale', () => {
  it('uses the stored locale when valid', () => {
    expect(resolveInitialLocale('en')).toBe('en')
  })

  it('defaults to spanish', () => {
    expect(resolveInitialLocale(null)).toBe('es')
    expect(resolveInitialLocale('fr')).toBe('es')
  })
})
