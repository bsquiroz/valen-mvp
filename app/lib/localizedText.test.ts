import { describe, expect, it } from 'vitest'
import { localize } from './localizedText'

describe('localize', () => {
  it('returns the text in the requested locale', () => {
    expect(localize({ es: 'Hola', en: 'Hi' }, 'en')).toBe('Hi')
  })

  it('falls back to spanish when the translation is empty', () => {
    expect(localize({ es: 'Hola', en: '' }, 'en')).toBe('Hola')
  })
})
