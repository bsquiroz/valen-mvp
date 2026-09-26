import { z } from 'zod'
import { addIsoDays } from '@/lib/dates'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextSchema } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'

export interface Challenge {
  id: string
  pillar: Pillar
  position: number
  title: LocalizedText
  description: LocalizedText
  // 1 = se hace una sola vez
  durationDays: number
  isActive: boolean
}

// Reto empezado por el usuario, con sus check-ins (fechas locales YYYY-MM-DD)
export interface Enrollment {
  challengeId: string
  // Días necesarios, fijados al empezar
  targetDays: number
  startedAt: string
  completedAt: string | null
  checkins: string[]
}

export type ChallengeState = 'not_started' | 'in_progress' | 'completed'

export const CHALLENGE_COLUMNS = 'id, pillar, position, title, description, duration_days, is_active'

const challengeRowSchema = z.object({
  id: z.string(),
  pillar: z.enum(PILLARS),
  position: z.number(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  duration_days: z.number(),
  is_active: z.boolean(),
})

export function mapChallenges(rows: unknown): Challenge[] {
  return z.array(challengeRowSchema).parse(rows).map(row => ({
    id: row.id,
    pillar: row.pillar,
    position: row.position,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    isActive: row.is_active,
  }))
}

const enrollmentRowSchema = z.object({
  challenge_id: z.string(),
  target_days: z.number(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
})

const checkinRowSchema = z.object({ challenge_id: z.string(), day: z.string() })

export function mapEnrollments(enrollmentRows: unknown, checkinRows: unknown): Enrollment[] {
  const checkins = new Map<string, string[]>()
  for (const row of z.array(checkinRowSchema).parse(checkinRows)) {
    checkins.set(row.challenge_id, [...(checkins.get(row.challenge_id) ?? []), row.day])
  }
  return z.array(enrollmentRowSchema).parse(enrollmentRows).map(row => ({
    challengeId: row.challenge_id,
    targetDays: row.target_days,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    checkins: [...(checkins.get(row.challenge_id) ?? [])].sort(),
  }))
}

export function challengesByPillar(challenges: Challenge[]): Record<Pillar, Challenge[]> {
  const groups = Object.fromEntries(PILLARS.map(pillar => [pillar, [] as Challenge[]])) as Record<Pillar, Challenge[]>
  for (const challenge of [...challenges].sort((a, b) => a.position - b.position)) groups[challenge.pillar].push(challenge)
  return groups
}

export function challengeState(enrollment: Enrollment | undefined): ChallengeState {
  if (!enrollment) return 'not_started'
  return enrollment.completedAt ? 'completed' : 'in_progress'
}

export function checkedInOn(enrollment: Enrollment, day: string): boolean {
  return enrollment.checkins.includes(day)
}

// Días seguidos con check-in hasta hoy (o hasta ayer, si hoy todavía no lo hizo).
export function currentStreak(enrollment: Enrollment, today: string): number {
  const days = new Set(enrollment.checkins)
  let cursor = days.has(today) ? today : addIsoDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = addIsoDays(cursor, -1)
  }
  return streak
}

export function challengeProgress(enrollment: Enrollment): { done: number, total: number, percent: number } {
  const done = Math.min(enrollment.checkins.length, enrollment.targetDays)
  return { done, total: enrollment.targetDays, percent: Math.round((done / enrollment.targetDays) * 100) }
}

// Añade el check-in al estado local tras guardarlo (la base decide si se completó; se recarga después).
export function withCheckin(enrollment: Enrollment, day: string): Enrollment {
  if (checkedInOn(enrollment, day)) return enrollment
  return { ...enrollment, checkins: [...enrollment.checkins, day].sort() }
}
