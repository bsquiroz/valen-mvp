import { describe, expect, it } from 'vitest'
import type { Enrollment } from './challenges'
import {
  challengeProgress,
  challengesByPillar,
  challengeState,
  checkedInOn,
  currentStreak,
  mapChallenges,
  mapEnrollments,
  withCheckin,
} from './challenges'

const text = (value: string) => ({ es: value, en: value })

const enrollment = (checkins: string[], completedAt: string | null = null): Enrollment => ({
  challengeId: 'c1',
  targetDays: 7,
  startedAt: '2026-09-20T10:00:00Z',
  completedAt,
  checkins,
})

describe('mappers', () => {
  it('maps challenges', () => {
    const [mapped] = mapChallenges([{ id: 'c1', pillar: 'finance', position: 1, title: text('t'), description: text('d'), duration_days: 7, is_active: true }])
    expect(mapped).toEqual({ id: 'c1', pillar: 'finance', position: 1, title: text('t'), description: text('d'), durationDays: 7, isActive: true })
  })

  it('joins sorted check-ins to each enrollment', () => {
    const [mapped] = mapEnrollments(
      [{ challenge_id: 'c1', target_days: 7, started_at: '2026-09-20T10:00:00Z', completed_at: null }],
      [{ challenge_id: 'c1', day: '2026-09-22' }, { challenge_id: 'c1', day: '2026-09-21' }, { challenge_id: 'c2', day: '2026-09-21' }],
    )
    expect(mapped?.checkins).toEqual(['2026-09-21', '2026-09-22'])
    expect(mapped?.targetDays).toBe(7)
  })
})

describe('selectors', () => {
  it('groups by pillar in order', () => {
    const groups = challengesByPillar(mapChallenges([
      { id: 'b', pillar: 'finance', position: 2, title: text('b'), description: text('d'), duration_days: 1, is_active: true },
      { id: 'a', pillar: 'finance', position: 1, title: text('a'), description: text('d'), duration_days: 7, is_active: true },
    ]))
    expect(groups.finance.map(c => c.id)).toEqual(['a', 'b'])
    expect(groups.fitness).toEqual([])
  })

  it('derives the state and progress', () => {
    expect(challengeState(undefined)).toBe('not_started')
    expect(challengeState(enrollment([]))).toBe('in_progress')
    expect(challengeState(enrollment([], '2026-09-27T00:00:00Z'))).toBe('completed')
    expect(challengeProgress(enrollment(['2026-09-21', '2026-09-22']))).toEqual({ done: 2, total: 7, percent: 29 })
  })

  it('counts the current streak up to today or yesterday', () => {
    const e = enrollment(['2026-09-20', '2026-09-22', '2026-09-23', '2026-09-24'])
    expect(currentStreak(e, '2026-09-24')).toBe(3)
    expect(currentStreak(e, '2026-09-25')).toBe(3)
    expect(currentStreak(e, '2026-09-26')).toBe(0)
  })

  it('adds a check-in once', () => {
    const e = withCheckin(enrollment(['2026-09-21']), '2026-09-22')
    expect(checkedInOn(e, '2026-09-22')).toBe(true)
    expect(withCheckin(e, '2026-09-22')).toBe(e)
  })
})
