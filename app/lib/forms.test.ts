import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fieldErrors } from './forms'

describe('fieldErrors', () => {
  it('keeps the first message of each field', () => {
    const schema = z.object({
      email: z.string().min(1, { error: 'required' }).email({ error: 'invalid' }),
      name: z.string().min(1, { error: 'required' }),
    })
    const result = schema.safeParse({ email: '', name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({ email: 'required', name: 'required' })
    }
  })
})
