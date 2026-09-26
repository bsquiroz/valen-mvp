import { describe, expect, it } from 'vitest'
import type { PlanStep } from './plan'
import { mapPlanSteps, nextStep, pillarsByPriority, progressOf, setStepCompleted, stepsByPillar } from './plan'

const text = (value: string) => ({ es: value, en: value })

function step(templateId: string, pillar: PlanStep['pillar'], position: number, completedAt: string | null = null): PlanStep {
  return { templateId, pillar, position, kind: 'action', title: text(templateId), description: null, completedAt }
}

const steps = [
  step('f2', 'finance', 2),
  step('f1', 'finance', 1, '2026-09-26T10:00:00Z'),
  step('p1', 'psychology', 1, '2026-09-26T10:00:00Z'),
  step('r1', 'relationships', 1),
]

describe('mapPlanSteps', () => {
  it('flattens the joined template', () => {
    const [mapped] = mapPlanSteps([{
      template_id: 't1',
      completed_at: null,
      plan_step_templates: { pillar: 'fitness', position: 3, kind: 'action', title: text('t'), description: text('d') },
    }])
    expect(mapped).toEqual({ templateId: 't1', pillar: 'fitness', position: 3, kind: 'action', title: text('t'), description: text('d'), completedAt: null })
  })

  it('rejects unknown kinds', () => {
    expect(() => mapPlanSteps([{
      template_id: 't1',
      completed_at: null,
      plan_step_templates: { pillar: 'fitness', position: 1, kind: 'video', title: text('t'), description: null },
    }])).toThrow()
  })
})

describe('selectors', () => {
  it('orders pillars from lowest to highest score', () => {
    expect(pillarsByPriority({ psychology: 80, finance: 20, fitness: 50, relationships: 20 }))
      .toEqual(['finance', 'relationships', 'fitness', 'psychology'])
  })

  it('groups steps by pillar sorted by position', () => {
    const groups = stepsByPillar(steps)
    expect(groups.finance.map(s => s.templateId)).toEqual(['f1', 'f2'])
    expect(groups.fitness).toEqual([])
  })

  it('computes progress', () => {
    expect(progressOf(steps)).toEqual({ done: 2, total: 4, percent: 50 })
    expect(progressOf([])).toEqual({ done: 0, total: 0, percent: 0 })
  })

  it('finds the next pending step following priority', () => {
    expect(nextStep(steps, ['psychology', 'finance', 'relationships', 'fitness'])?.templateId).toBe('f2')
    expect(nextStep(steps, ['relationships', 'finance', 'psychology', 'fitness'])?.templateId).toBe('r1')
    expect(nextStep(steps.map(s => ({ ...s, completedAt: 'x' })), ['finance'])).toBeNull()
  })

  it('marks a step as completed or pending', () => {
    expect(setStepCompleted(steps, 'f2', 'now').find(s => s.templateId === 'f2')?.completedAt).toBe('now')
    expect(setStepCompleted(steps, 'f1', null).find(s => s.templateId === 'f1')?.completedAt).toBeNull()
  })
})
