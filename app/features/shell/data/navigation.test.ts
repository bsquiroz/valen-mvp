import { describe, expect, it } from 'vitest'
import { isNavActive } from './navigation'

describe('isNavActive', () => {
  it('matches home only exactly', () => {
    expect(isNavActive('/', '/')).toBe(true)
    expect(isNavActive('/courses', '/')).toBe(false)
  })

  it('matches a section and its subpages', () => {
    expect(isNavActive('/courses', '/courses')).toBe(true)
    expect(isNavActive('/courses/abc', '/courses')).toBe(true)
  })

  it('does not match sections sharing a prefix', () => {
    expect(isNavActive('/courses-archive', '/courses')).toBe(false)
  })
})
