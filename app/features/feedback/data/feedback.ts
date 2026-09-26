import { z } from 'zod'

// Mismos valores que los enums public.feedback_type y public.feedback_status
export const FEEDBACK_TYPES = ['suggestion', 'bug', 'complaint', 'improvement'] as const
export type FeedbackType = typeof FEEDBACK_TYPES[number]

export const FEEDBACK_STATUSES = ['new', 'in_review', 'resolved', 'dismissed'] as const
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number]

export const FEEDBACK_MIN_LENGTH = 10
export const FEEDBACK_MAX_LENGTH = 2000

export interface FeedbackEntry {
  id: string
  type: FeedbackType
  message: string
  page: string | null
  userAgent: string | null
  status: FeedbackStatus
  createdAt: string
  userId: string
  displayName: string | null
  email: string | null
}

// El tipo empieza vacío ('') para que el usuario lo elija
export const feedbackFormSchema = z.object({
  type: z.string().pipe(z.enum(FEEDBACK_TYPES, { error: 'feedback.errors.typeRequired' })),
  message: z.string().trim()
    .min(FEEDBACK_MIN_LENGTH, { error: 'feedback.errors.messageMin' })
    .max(FEEDBACK_MAX_LENGTH, { error: 'feedback.errors.messageMax' }),
})

export type FeedbackForm = z.output<typeof feedbackFormSchema>

const entryRowSchema = z.object({
  id: z.string(),
  type: z.enum(FEEDBACK_TYPES),
  message: z.string(),
  page: z.string().nullable(),
  user_agent: z.string().nullable(),
  status: z.enum(FEEDBACK_STATUSES),
  created_at: z.string(),
  user_id: z.string(),
  display_name: z.string().nullable(),
  email: z.string().nullable(),
})

export function mapFeedbackEntries(rows: unknown): FeedbackEntry[] {
  return z.array(entryRowSchema).parse(rows).map(row => ({
    id: row.id,
    type: row.type,
    message: row.message,
    page: row.page,
    userAgent: row.user_agent,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
  }))
}

export interface FeedbackFilters {
  type: FeedbackType | 'all'
  status: FeedbackStatus | 'all'
}

export function filterFeedback(entries: FeedbackEntry[], filters: FeedbackFilters): FeedbackEntry[] {
  return entries.filter(entry =>
    (filters.type === 'all' || entry.type === filters.type)
    && (filters.status === 'all' || entry.status === filters.status))
}

export function countByStatus(entries: FeedbackEntry[]): Record<FeedbackStatus, number> {
  const counts = Object.fromEntries(FEEDBACK_STATUSES.map(status => [status, 0])) as Record<FeedbackStatus, number>
  for (const entry of entries) counts[entry.status]++
  return counts
}

export function setEntryStatus(entries: FeedbackEntry[], id: string, status: FeedbackStatus): FeedbackEntry[] {
  return entries.map(entry => (entry.id === id ? { ...entry, status } : entry))
}

export function isRateLimitedError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'hint' in error && error.hint === 'feedback_rate_limited'
}
