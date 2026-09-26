import { z } from 'zod'
import type { PillarScores } from '@/features/diagnostic/data/diagnostic'
import { opportunityAreas } from '@/features/diagnostic/data/diagnostic'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextSchema } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'

export const PLAN_STEP_KINDS = ['action', 'lesson', 'challenge', 'session'] as const
export type PlanStepKind = typeof PLAN_STEP_KINDS[number]

export interface PlanStep {
  templateId: string
  pillar: Pillar
  position: number
  kind: PlanStepKind
  title: LocalizedText
  description: LocalizedText | null
  completedAt: string | null
}

export interface Progress {
  done: number
  total: number
  // 0–100
  percent: number
}

const planStepRowSchema = z.object({
  template_id: z.string(),
  completed_at: z.string().nullable(),
  plan_step_templates: z.object({
    pillar: z.enum(PILLARS),
    position: z.number(),
    kind: z.enum(PLAN_STEP_KINDS),
    title: localizedTextSchema,
    description: localizedTextSchema.nullable(),
  }),
})

export function mapPlanSteps(rows: unknown): PlanStep[] {
  return z.array(planStepRowSchema).parse(rows).map(row => ({
    templateId: row.template_id,
    pillar: row.plan_step_templates.pillar,
    position: row.plan_step_templates.position,
    kind: row.plan_step_templates.kind,
    title: row.plan_step_templates.title,
    description: row.plan_step_templates.description,
    completedAt: row.completed_at,
  }))
}

// Pilares del de menor al de mayor puntaje: ese es el orden de prioridad del plan.
export function pillarsByPriority(scores: PillarScores): Pillar[] {
  return opportunityAreas(scores, PILLARS.length)
}

export function stepsByPillar(steps: PlanStep[]): Record<Pillar, PlanStep[]> {
  const groups = Object.fromEntries(PILLARS.map(pillar => [pillar, [] as PlanStep[]])) as Record<Pillar, PlanStep[]>
  for (const step of [...steps].sort((a, b) => a.position - b.position)) groups[step.pillar].push(step)
  return groups
}

export function progressOf(steps: PlanStep[]): Progress {
  const done = steps.filter(step => step.completedAt).length
  const total = steps.length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

// Primer paso pendiente siguiendo la prioridad de los pilares.
export function nextStep(steps: PlanStep[], priority: Pillar[]): PlanStep | null {
  const groups = stepsByPillar(steps)
  for (const pillar of priority) {
    const pending = groups[pillar].find(step => !step.completedAt)
    if (pending) return pending
  }
  return null
}

export function setStepCompleted(steps: PlanStep[], templateId: string, completedAt: string | null): PlanStep[] {
  return steps.map(step => (step.templateId === templateId ? { ...step, completedAt } : step))
}
