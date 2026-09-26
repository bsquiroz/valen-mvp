import { describe, expect, it } from 'vitest'
import type { AdminChallenge } from './adminChallenges'
import {
  addChallenge,
  canDeleteChallenge,
  challengeFormSchema,
  countChallengeChanges,
  isChallengeInUseError,
  mapAdminChallenges,
  removeChallenge,
  toChallengeFormInput,
  toChallengesPayload,
  updateChallenge,
} from './adminChallenges'

const text = (value: string) => ({ es: value, en: value })

const challenge = (overrides: Partial<AdminChallenge> = {}): AdminChallenge => ({
  id: 'c1',
  pillar: 'finance',
  position: 1,
  title: text('Registro de gastos'),
  description: text('d'),
  durationDays: 7,
  isActive: true,
  started: 0,
  completed: 0,
  ...overrides,
})

describe('mapAdminChallenges', () => {
  it('joins usage', () => {
    const [mapped] = mapAdminChallenges(
      [{ id: 'c1', pillar: 'finance', position: 1, title: text('t'), description: text('d'), duration_days: 7, is_active: true }],
      [{ challenge_id: 'c1', started: 5, completed: 2 }],
    )
    expect(mapped).toMatchObject({ started: 5, completed: 2, durationDays: 7 })
  })
})

describe('challengeFormSchema', () => {
  const valid = { title: text('t'), description: text('d'), durationDays: '7' }

  it('parses the number of days', () => {
    const result = challengeFormSchema.safeParse(valid)
    expect(result.success && result.data.durationDays).toBe(7)
  })

  it('rejects invalid days and missing texts', () => {
    expect(challengeFormSchema.safeParse({ ...valid, durationDays: '0' }).success).toBe(false)
    expect(challengeFormSchema.safeParse({ ...valid, durationDays: '91' }).success).toBe(false)
    expect(challengeFormSchema.safeParse({ ...valid, description: { es: 'd', en: '' } }).success).toBe(false)
  })

  it('defaults new challenges to 7 days', () => {
    expect(toChallengeFormInput().durationDays).toBe('7')
    expect(toChallengeFormInput(challenge({ durationDays: 1 })).durationDays).toBe('1')
  })
})

describe('editor ops', () => {
  it('adds at the end of the pillar', () => {
    const result = addChallenge([challenge({ position: 2 })], 'finance', { title: text('n'), description: text('d'), durationDays: 14 }, 'temp-x')
    expect(result.at(-1)).toMatchObject({ id: 'temp-x', position: 3, durationDays: 14, isActive: true, started: 0 })
  })

  it('protects started challenges', () => {
    expect(canDeleteChallenge(challenge({ started: 1 }))).toBe(false)
    expect(() => removeChallenge([challenge({ started: 1 })], 'c1')).toThrow()
    expect(removeChallenge([challenge()], 'c1')).toEqual([])
  })

  it('builds the payload and counts changes', () => {
    const saved = [challenge()]
    const draft = addChallenge(updateChallenge(saved, 'c1', { isActive: false }), 'fitness', { title: text('n'), description: text('d'), durationDays: 1 }, 'temp-x')
    expect(toChallengesPayload(draft).map(c => c.id)).toEqual(['c1', null])
    expect(toChallengesPayload(saved)[0]).toEqual({ id: 'c1', pillar: 'finance', title: text('Registro de gastos'), description: text('d'), duration_days: 7, is_active: true })
    expect(countChallengeChanges(saved, saved)).toBe(0)
    expect(countChallengeChanges(saved, draft)).toBe(2)
  })

  it('detects the in-use error', () => {
    expect(isChallengeInUseError({ hint: 'challenge_in_use' })).toBe(true)
    expect(isChallengeInUseError({})).toBe(false)
  })
})
