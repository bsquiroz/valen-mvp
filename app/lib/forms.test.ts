import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { EARLY_ISSUE, fieldErrors, isVisibleBeforeSubmit } from './forms'

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

  it('uses dotted paths for nested fields and "form" for root issues', () => {
    const schema = z.object({ items: z.array(z.object({ name: z.string().min(1, { error: 'required' }) })) })
    const result = schema.safeParse({ items: [{ name: 'ok' }, { name: '' }] })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ 'items.1.name': 'required' })

    const root = z.object({}).refine(() => false, { error: 'root' }).safeParse({})
    if (!root.success) expect(fieldErrors(root.error)).toEqual({ form: 'root' })
  })
})

describe('isVisibleBeforeSubmit', () => {
  const schema = z.object({
    videoId: z.string().regex(/^\d+$/, { error: 'format' }),
    title: z.string().min(1, { error: 'required' }),
    description: z.object({ es: z.string(), en: z.string() }),
  }).superRefine((form, ctx) => {
    if (form.description.es && !form.description.en) {
      ctx.addIssue({ code: 'custom', path: ['description', 'en'], message: 'both', params: EARLY_ISSUE })
    }
  })

  it('shows format errors of fields with text and early rules, not empty required fields', () => {
    const values = { videoId: 'abc', title: '', description: { es: 'd', en: '' } }
    const result = schema.safeParse(values)
    expect(result.success).toBe(false)
    if (!result.success) {
      // El título vacío no se marca todavía; el formato y la regla entre campos sí
      expect(fieldErrors(result.error, issue => isVisibleBeforeSubmit(issue, values))).toEqual({ 'videoId': 'format', 'description.en': 'both' })
    }
    const halfDescription = { videoId: '1', title: 't', description: { es: 'd', en: '' } }
    const second = schema.safeParse(halfDescription)
    if (!second.success) {
      expect(fieldErrors(second.error, issue => isVisibleBeforeSubmit(issue, halfDescription))).toEqual({ 'description.en': 'both' })
    }
  })
})
