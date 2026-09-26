import { z } from 'zod'
import type { ScoreLevel } from '@/features/diagnostic/data/diagnostic'
import { SCORE_LEVELS } from '@/features/diagnostic/data/diagnostic'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextInputSchema, localizedTextSchema } from '@/lib/localizedText'
import { EARLY_ISSUE } from '@/lib/forms'
import { nextPosition } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import { isTempId } from '@/lib/tempId'
import type { PlanStepKind } from './plan'
import { PLAN_STEP_KINDS } from './plan'

// Plantilla de un paso del plan, tal como la edita el admin.
// Regla: cambiar la ruta nunca le quita progreso a un usuario. Un paso que ya está en algún plan
// no se borra, se desactiva; los cambios de niveles y los pasos nuevos aplican a los planes nuevos.
export interface PlanStepTemplate {
  id: string
  pillar: Pillar
  position: number
  levels: ScoreLevel[]
  kind: PlanStepKind
  title: LocalizedText
  description: LocalizedText | null
  isActive: boolean
  // En cuántos planes de usuarios está
  users: number
}

const templateRowSchema = z.object({
  id: z.string(),
  pillar: z.enum(PILLARS),
  position: z.number(),
  levels: z.array(z.enum(SCORE_LEVELS)),
  kind: z.enum(PLAN_STEP_KINDS),
  title: localizedTextSchema,
  description: localizedTextSchema.nullable(),
  is_active: z.boolean(),
})

const usageRowSchema = z.object({
  template_id: z.string(),
  users: z.number(),
})

export function mapPlanStepTemplates(rows: unknown, usageRows: unknown): PlanStepTemplate[] {
  const usage = new Map(z.array(usageRowSchema).parse(usageRows).map(row => [row.template_id, row.users]))
  return z.array(templateRowSchema).parse(rows).map(row => ({
    id: row.id,
    pillar: row.pillar,
    position: row.position,
    // Siempre en el orden bajo → medio → alto
    levels: SCORE_LEVELS.filter(level => row.levels.includes(level)),
    kind: row.kind,
    title: row.title,
    description: row.description,
    isActive: row.is_active,
    users: usage.get(row.id) ?? 0,
  }))
}

// Solo se borra un paso que no está en ningún plan; si no, se desactiva.
export function canDeleteTemplate(template: PlanStepTemplate): boolean {
  return template.users === 0
}

const optionalText = z.string().trim().max(500, { error: 'admin.errors.textTooLong' })

// La descripción es opcional: vacía en ambos idiomas = sin descripción; si hay una, van las dos.
export const planStepFormSchema = z.object({
  title: localizedTextInputSchema,
  description: z.object({ es: optionalText, en: optionalText }),
  levels: z.array(z.enum(SCORE_LEVELS)).min(1, { error: 'admin.plan.errors.levelsRequired' }),
}).superRefine((form, ctx) => {
  const { es, en } = form.description
  if (!es && en) ctx.addIssue({ code: 'custom', path: ['description', 'es'], message: 'admin.errors.textRequired', params: EARLY_ISSUE })
  if (es && !en) ctx.addIssue({ code: 'custom', path: ['description', 'en'], message: 'admin.errors.textRequired', params: EARLY_ISSUE })
}).transform(form => ({
  title: form.title,
  description: form.description.es ? form.description : null,
  levels: SCORE_LEVELS.filter(level => form.levels.includes(level)),
}))

export type PlanStepFormInput = z.input<typeof planStepFormSchema>
export type PlanStepForm = z.output<typeof planStepFormSchema>

export function toPlanStepFormInput(template?: PlanStepTemplate): PlanStepFormInput {
  return {
    title: { es: template?.title.es ?? '', en: template?.title.en ?? '' },
    description: { es: template?.description?.es ?? '', en: template?.description?.en ?? '' },
    levels: template ? [...template.levels] : [...SCORE_LEVELS],
  }
}

// Transformaciones inmutables para los cambios optimistas del editor.

export function addTemplate(templates: PlanStepTemplate[], pillar: Pillar, form: PlanStepForm, id: string): PlanStepTemplate[] {
  return [...templates, {
    id,
    pillar,
    position: nextPosition(templates, pillar),
    kind: 'action',
    ...form,
    isActive: true,
    users: 0,
  }]
}

export function updateTemplate(
  templates: PlanStepTemplate[],
  id: string,
  patch: Partial<Pick<PlanStepTemplate, 'title' | 'description' | 'levels' | 'isActive'>>,
): PlanStepTemplate[] {
  return templates.map(template => (template.id === id ? { ...template, ...patch } : template))
}

export function removeTemplate(templates: PlanStepTemplate[], id: string): PlanStepTemplate[] {
  const template = templates.find(candidate => candidate.id === id)
  if (template && !canDeleteTemplate(template)) throw new Error('A plan step in use cannot be deleted')
  return templates.filter(candidate => candidate.id !== id)
}

// El borrado de un paso en uso lo rechaza la base (admin_save_plan_steps).
export function isTemplateInUseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'hint' in error && error.hint === 'plan_step_in_use'
}

// Estado completo para admin_save_plan_steps: orden por pilar y posición; lo nuevo va con id null.
export function toPlanStepsPayload(templates: PlanStepTemplate[]) {
  return [...templates]
    .sort((a, b) => a.pillar.localeCompare(b.pillar) || a.position - b.position)
    .map(template => ({
      id: isTempId(template.id) ? null : template.id,
      pillar: template.pillar,
      title: template.title,
      description: template.description,
      levels: template.levels,
      is_active: template.isActive,
    }))
}

// Pasos con cambios respecto a lo guardado (nuevos, borrados, movidos o editados).
export function countPlanChanges(saved: PlanStepTemplate[], draft: PlanStepTemplate[]): number {
  const savedById = new Map(saved.map(template => [template.id, template]))
  const draftIds = new Set(draft.map(template => template.id))
  const removed = saved.filter(template => !draftIds.has(template.id)).length
  const changed = draft.filter((template) => {
    const before = savedById.get(template.id)
    return !before
      || before.position !== template.position
      || before.isActive !== template.isActive
      || JSON.stringify([before.title, before.description, before.levels])
      !== JSON.stringify([template.title, template.description, template.levels])
  }).length
  return removed + changed
}
