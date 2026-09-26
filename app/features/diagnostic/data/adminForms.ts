import { z } from 'zod'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextInputSchema } from '@/lib/localizedText'

// Mismas reglas que la base de datos (check de score y mínimo de opciones).
export const SCORE_VALUES = [0, 1, 2, 3] as const
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6

export const scoreSchema = z.number().int().min(0, { error: 'admin.errors.scoreRange' }).max(3, { error: 'admin.errors.scoreRange' })

export const optionFormSchema = z.object({
  label: localizedTextInputSchema,
  score: scoreSchema,
})

export const questionFormSchema = z.object({
  prompt: localizedTextInputSchema,
  options: z.array(optionFormSchema)
    .min(MIN_OPTIONS, { error: 'admin.errors.minOptions' })
    .max(MAX_OPTIONS, { error: 'admin.errors.maxOptions' }),
})

export type OptionForm = z.output<typeof optionFormSchema>
export type QuestionForm = z.output<typeof questionFormSchema>

const emptyText = (): LocalizedText => ({ es: '', en: '' })

export function emptyOptionForm(score = 0): OptionForm {
  return { label: emptyText(), score }
}

// 4 opciones con puntajes 0–3, el caso habitual.
export function emptyQuestionForm(): QuestionForm {
  return { prompt: emptyText(), options: SCORE_VALUES.map(score => emptyOptionForm(score)) }
}
