import { describe, expect, it } from 'vitest'
import type { PlanStepTemplate } from './adminPlan'
import {
  addTemplate,
  canDeleteTemplate,
  countPlanChanges,
  isTemplateInUseError,
  mapPlanStepTemplates,
  planStepFormSchema,
  removeTemplate,
  toPlanStepFormInput,
  toPlanStepsPayload,
  updateTemplate,
} from './adminPlan'

const text = (value: string) => ({ es: value, en: value })

const row = {
  id: 't1',
  pillar: 'finance',
  position: 1,
  levels: ['high', 'low'],
  kind: 'action',
  title: text('Presupuesto'),
  description: null,
  is_active: true,
}

const template = (overrides: Partial<PlanStepTemplate> = {}): PlanStepTemplate => ({
  id: 't1',
  pillar: 'finance',
  position: 1,
  levels: ['low'],
  kind: 'action',
  title: text('a'),
  description: null,
  isActive: true,
  users: 0,
  ...overrides,
})

describe('mapPlanStepTemplates', () => {
  it('maps rows, sorts levels and joins usage', () => {
    const [mapped] = mapPlanStepTemplates([row], [{ template_id: 't1', users: 3 }])
    expect(mapped).toEqual({
      id: 't1',
      pillar: 'finance',
      position: 1,
      levels: ['low', 'high'],
      kind: 'action',
      title: text('Presupuesto'),
      description: null,
      isActive: true,
      users: 3,
    })
  })

  it('defaults usage to zero and rejects unknown values', () => {
    expect(mapPlanStepTemplates([row], [])[0]?.users).toBe(0)
    expect(() => mapPlanStepTemplates([{ ...row, levels: ['max'] }], [])).toThrow()
  })
})

describe('planStepFormSchema', () => {
  const valid = { title: text('t'), description: { es: '', en: '' }, levels: ['high', 'low'] as const }

  it('treats an empty description as none and sorts levels', () => {
    const result = planStepFormSchema.safeParse({ ...valid, levels: [...valid.levels] })
    expect(result.success && result.data).toEqual({ title: text('t'), description: null, levels: ['low', 'high'] })
  })

  it('requires both languages when there is a description', () => {
    const result = planStepFormSchema.safeParse({ ...valid, levels: ['low'], description: { es: 'd', en: ' ' } })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['description', 'en'])
  })

  it('requires at least one level', () => {
    const result = planStepFormSchema.safeParse({ ...valid, levels: [] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe('admin.plan.errors.levelsRequired')
  })

  it('builds form values from a template or empty', () => {
    expect(toPlanStepFormInput().levels).toEqual(['low', 'medium', 'high'])
    expect(toPlanStepFormInput(template({ description: text('d') })).description).toEqual(text('d'))
  })
})

describe('editor ops', () => {
  it('adds at the end of the pillar as an active, unused action', () => {
    const result = addTemplate([template({ position: 3 })], 'finance', { title: text('n'), description: null, levels: ['low'] }, 'new')
    expect(result.at(-1)).toMatchObject({ id: 'new', position: 4, kind: 'action', isActive: true, users: 0 })
  })

  it('updates without mutating', () => {
    const base = [template()]
    expect(updateTemplate(base, 't1', { isActive: false })[0]?.isActive).toBe(false)
    expect(base[0]?.isActive).toBe(true)
  })

  it('only deletes steps that are not in any plan', () => {
    expect(canDeleteTemplate(template())).toBe(true)
    expect(canDeleteTemplate(template({ users: 2 }))).toBe(false)
    expect(removeTemplate([template()], 't1')).toEqual([])
    expect(() => removeTemplate([template({ users: 1 })], 't1')).toThrow()
  })

  it('detects the in-use error from the database', () => {
    expect(isTemplateInUseError({ code: '23503', hint: 'plan_step_in_use' })).toBe(true)
    expect(isTemplateInUseError({ code: '23503' })).toBe(false)
  })
})

describe('draft', () => {
  const saved = [template(), template({ id: 't2', position: 2, users: 1 })]

  it('builds the full payload ordered by pillar and position, new items without id', () => {
    const draft = addTemplate(saved, 'finance', { title: text('n'), description: null, levels: ['low'] }, 'temp-x')
    expect(toPlanStepsPayload(draft).map(step => step.id)).toEqual(['t1', 't2', null])
    expect(toPlanStepsPayload(saved)[0]).toEqual({
      id: 't1',
      pillar: 'finance',
      title: text('a'),
      description: null,
      levels: ['low'],
      is_active: true,
    })
  })

  it('counts steps with changes', () => {
    expect(countPlanChanges(saved, saved)).toBe(0)
    expect(countPlanChanges(saved, updateTemplate(saved, 't2', { isActive: false }))).toBe(1)
    expect(countPlanChanges(saved, updateTemplate(saved, 't1', { levels: ['low', 'high'] }))).toBe(1)
    expect(countPlanChanges(saved, removeTemplate(saved, 't1'))).toBe(1)
  })
})
