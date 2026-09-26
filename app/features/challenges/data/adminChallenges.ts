import { z } from 'zod'
import { localizedLongTextInputSchema, localizedTextInputSchema } from '@/lib/localizedText'
import { nextPosition } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import { isTempId } from '@/lib/tempId'
import type { Challenge } from './challenges'
import { mapChallenges } from './challenges'

// Reto tal como lo edita el admin, con cuántos usuarios lo empezaron y completaron.
// Regla: un reto que alguien empezó no se borra (se desactiva).
export interface AdminChallenge extends Challenge {
  started: number
  completed: number
}

const usageRowSchema = z.object({ challenge_id: z.string(), started: z.number(), completed: z.number() })

export function mapAdminChallenges(rows: unknown, usageRows: unknown): AdminChallenge[] {
  const usage = new Map(z.array(usageRowSchema).parse(usageRows).map(row => [row.challenge_id, row]))
  return mapChallenges(rows).map(challenge => ({
    ...challenge,
    started: usage.get(challenge.id)?.started ?? 0,
    completed: usage.get(challenge.id)?.completed ?? 0,
  }))
}

export function canDeleteChallenge(challenge: AdminChallenge): boolean {
  return challenge.started === 0
}

export function isChallengeInUseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'hint' in error && error.hint === 'challenge_in_use'
}

export const MAX_CHALLENGE_DAYS = 90

// Título, descripción (ES/EN) y días obligatorios. Los días llegan como texto del input.
export const challengeFormSchema = z.object({
  title: localizedTextInputSchema,
  description: localizedLongTextInputSchema,
  durationDays: z.string().trim().refine(value => /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_CHALLENGE_DAYS, {
    error: 'admin.challenges.errors.duration',
  }),
}).transform(form => ({ title: form.title, description: form.description, durationDays: Number(form.durationDays) }))

export type ChallengeFormInput = z.input<typeof challengeFormSchema>
export type ChallengeForm = z.output<typeof challengeFormSchema>

export function toChallengeFormInput(challenge?: AdminChallenge): ChallengeFormInput {
  return {
    title: { es: challenge?.title.es ?? '', en: challenge?.title.en ?? '' },
    description: { es: challenge?.description.es ?? '', en: challenge?.description.en ?? '' },
    durationDays: challenge ? String(challenge.durationDays) : '7',
  }
}

// Transformaciones inmutables del borrador

export function addChallenge(challenges: AdminChallenge[], pillar: Pillar, form: ChallengeForm, id: string): AdminChallenge[] {
  return [...challenges, { id, pillar, position: nextPosition(challenges, pillar), ...form, isActive: true, started: 0, completed: 0 }]
}

export function updateChallenge(
  challenges: AdminChallenge[],
  id: string,
  patch: Partial<Pick<AdminChallenge, 'title' | 'description' | 'durationDays' | 'isActive'>>,
): AdminChallenge[] {
  return challenges.map(challenge => (challenge.id === id ? { ...challenge, ...patch } : challenge))
}

export function removeChallenge(challenges: AdminChallenge[], id: string): AdminChallenge[] {
  const challenge = challenges.find(candidate => candidate.id === id)
  if (challenge && !canDeleteChallenge(challenge)) throw new Error('A started challenge cannot be deleted')
  return challenges.filter(candidate => candidate.id !== id)
}

// Estado completo para admin_save_challenges: orden por pilar y posición; lo nuevo va con id null.
export function toChallengesPayload(challenges: AdminChallenge[]) {
  return [...challenges]
    .sort((a, b) => PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar) || a.position - b.position)
    .map(challenge => ({
      id: isTempId(challenge.id) ? null : challenge.id,
      pillar: challenge.pillar,
      title: challenge.title,
      description: challenge.description,
      duration_days: challenge.durationDays,
      is_active: challenge.isActive,
    }))
}

export function countChallengeChanges(saved: AdminChallenge[], draft: AdminChallenge[]): number {
  const snapshot = (c: AdminChallenge) => JSON.stringify([c.position, c.title, c.description, c.durationDays, c.isActive])
  const savedById = new Map(saved.map(challenge => [challenge.id, snapshot(challenge)]))
  const draftIds = new Set(draft.map(challenge => challenge.id))
  const removed = saved.filter(challenge => !draftIds.has(challenge.id)).length
  const changed = draft.filter(challenge => savedById.get(challenge.id) !== snapshot(challenge)).length
  return removed + changed
}
