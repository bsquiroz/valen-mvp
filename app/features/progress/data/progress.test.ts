import { describe, expect, it } from 'vitest'
import type { Challenge, Enrollment } from '@/features/challenges/data/challenges'
import type { Course, Lesson } from '@/features/courses/data/courses'
import type { PlanStep } from '@/features/plan/data/plan'
import type { Pillar } from '@/lib/pillars'
import { overallProgress, progressByPillar, totalProgress } from './progress'

const text = (value: string) => ({ es: value, en: value })

function step(templateId: string, pillar: Pillar, done: boolean): PlanStep {
  return { templateId, pillar, position: 1, kind: 'action', title: text(templateId), description: null, completedAt: done ? '2026-09-01T00:00:00Z' : null }
}

function lesson(id: string): Lesson {
  return { id, courseId: 'c', position: 1, title: text(id), description: null, videoId: 'v', durationSeconds: null, isActive: true }
}

function course(id: string, pillar: Pillar, lessonIds: string[]): Course {
  return { id, pillar, position: 1, title: text(id), description: null, isActive: true, lessons: lessonIds.map(lesson) }
}

function challenge(id: string, pillar: Pillar): Challenge {
  return { id, pillar, position: 1, title: text(id), description: text(id), durationDays: 7, isActive: true }
}

function enrollment(challengeId: string, completed: boolean): Enrollment {
  return { challengeId, targetDays: 7, startedAt: '2026-09-01T00:00:00Z', completedAt: completed ? '2026-09-08T00:00:00Z' : null, checkins: [] }
}

describe('overallProgress', () => {
  it('averages the percentages of sources with content, each weighing the same', () => {
    expect(overallProgress([
      { done: 1, total: 2, percent: 50 },
      { done: 0, total: 20, percent: 0 },
      { done: 0, total: 0, percent: 0 },
    ])).toEqual({ done: 1, total: 22, percent: 25 })
  })

  it('is zero when nothing has content', () => {
    expect(overallProgress([{ done: 0, total: 0, percent: 0 }])).toEqual({ done: 0, total: 0, percent: 0 })
  })
})

describe('progressByPillar', () => {
  const result = progressByPillar({
    planSteps: [step('s1', 'finance', true), step('s2', 'finance', false), step('s3', 'fitness', true)],
    courses: [course('c1', 'finance', ['l1', 'l2', 'l3', 'l4']), course('c2', 'finance', [])],
    completedLessons: new Set(['l1', 'l2', 'l3', 'l4']),
    challenges: [challenge('ch1', 'finance'), challenge('ch2', 'finance'), challenge('ch3', 'finance'), challenge('ch4', 'finance')],
    enrollments: [enrollment('ch1', true), enrollment('ch2', false), enrollment('other', true)],
  })

  it('counts each source per pillar', () => {
    expect(result.finance.sources).toEqual({
      plan: { done: 1, total: 2, percent: 50 },
      lessons: { done: 4, total: 4, percent: 100 },
      challenges: { done: 1, total: 4, percent: 25 },
    })
    expect(result.finance.challengesInProgress).toBe(1)
    expect(result.finance.overall.percent).toBe(58)
  })

  it('ignores sources without content and leaves empty pillars at zero', () => {
    expect(result.fitness.overall).toEqual({ done: 1, total: 1, percent: 100 })
    expect(result.psychology.overall).toEqual({ done: 0, total: 0, percent: 0 })
  })

  it('averages the pillars with content for the total', () => {
    expect(totalProgress(result).percent).toBe(79)
  })
})
