import { describe, expect, it } from 'vitest'
import type { FeedbackEntry } from './feedback'
import { countByStatus, feedbackFormSchema, filterFeedback, isRateLimitedError, mapFeedbackEntries, setEntryStatus } from './feedback'

const row = {
  id: 'f1',
  type: 'bug',
  message: 'El video no carga en la lección 2',
  page: '/courses/c/l',
  user_agent: 'Mozilla/5.0',
  status: 'new',
  created_at: '2026-09-27T10:00:00Z',
  user_id: 'u1',
  display_name: 'Ana',
  email: 'ana@x.co',
}

describe('mapFeedbackEntries', () => {
  it('maps rows and rejects unknown types', () => {
    const [entry] = mapFeedbackEntries([row])
    expect(entry).toMatchObject({ id: 'f1', type: 'bug', userAgent: 'Mozilla/5.0', displayName: 'Ana' })
    expect(() => mapFeedbackEntries([{ ...row, type: 'rant' }])).toThrow()
  })
})

describe('feedbackFormSchema', () => {
  it('requires a type and a message of at least 10 characters', () => {
    expect(feedbackFormSchema.safeParse({ type: 'bug', message: '  El botón no responde  ' }).success).toBe(true)
    expect(feedbackFormSchema.safeParse({ type: '', message: 'Mensaje suficientemente largo' }).success).toBe(false)
    expect(feedbackFormSchema.safeParse({ type: 'bug', message: 'corto' }).success).toBe(false)
  })
})

describe('selectors', () => {
  const entries: FeedbackEntry[] = mapFeedbackEntries([
    row,
    { ...row, id: 'f2', type: 'suggestion', status: 'resolved' },
    { ...row, id: 'f3', type: 'bug', status: 'resolved' },
  ])

  it('filters by type and status', () => {
    expect(filterFeedback(entries, { type: 'bug', status: 'all' }).map(e => e.id)).toEqual(['f1', 'f3'])
    expect(filterFeedback(entries, { type: 'all', status: 'resolved' }).map(e => e.id)).toEqual(['f2', 'f3'])
    expect(filterFeedback(entries, { type: 'all', status: 'all' })).toHaveLength(3)
  })

  it('counts by status and updates one entry', () => {
    expect(countByStatus(entries)).toEqual({ new: 1, in_review: 0, resolved: 2, dismissed: 0 })
    expect(setEntryStatus(entries, 'f1', 'in_review')[0]?.status).toBe('in_review')
    expect(entries[0]?.status).toBe('new')
  })

  it('detects the rate limit error', () => {
    expect(isRateLimitedError({ hint: 'feedback_rate_limited' })).toBe(true)
    expect(isRateLimitedError({})).toBe(false)
  })
})
