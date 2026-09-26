import { describe, expect, it } from 'vitest'
import { isTempId, tempId } from './tempId'

describe('tempId', () => {
  it('creates distinct temporary ids that are recognized as such', () => {
    const a = tempId()
    expect(isTempId(a)).toBe(true)
    expect(a).not.toBe(tempId())
    expect(isTempId('6f1c2b0e-0000-4000-8000-000000000000')).toBe(false)
  })
})
