import type { LocalizedText } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { getSupabase } from '@/lib/supabase'
import type { OptionForm, QuestionForm } from '../data/adminForms'

// Operaciones de admin sobre el diagnóstico. La base valida permisos (is_admin) y reglas
// (textos ES/EN, 2–6 opciones, puntaje 0–3); las RPC cubren lo que requiere atomicidad.

// Un update/delete que RLS filtra no da error: devuelve 0 filas. Lo tratamos como fallo.
function assertAffected(data: unknown[] | null) {
  if (!data?.length) throw new Error('No rows affected')
}

export async function createQuestion(pillar: Pillar, form: QuestionForm): Promise<string> {
  const { data, error } = await getSupabase().rpc('admin_create_diagnostic_question', {
    p_pillar: pillar,
    p_prompt: form.prompt,
    p_options: form.options,
  })
  if (error) throw error
  return data
}

export async function updateQuestionPrompt(questionId: string, prompt: LocalizedText): Promise<void> {
  const { data, error } = await getSupabase()
    .from('diagnostic_questions')
    .update({ prompt })
    .eq('id', questionId)
    .select('id')
  if (error) throw error
  assertAffected(data)
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('diagnostic_questions')
    .delete()
    .eq('id', questionId)
    .select('id')
  if (error) throw error
  assertAffected(data)
}

export async function reorderQuestions(pillar: Pillar, orderedIds: string[]): Promise<void> {
  const { error } = await getSupabase().rpc('admin_reorder_diagnostic_questions', {
    p_pillar: pillar,
    p_ids: orderedIds,
  })
  if (error) throw error
}

export async function addOption(questionId: string, form: OptionForm): Promise<string> {
  const { data, error } = await getSupabase().rpc('admin_add_diagnostic_option', {
    p_question_id: questionId,
    p_label: form.label,
    p_score: form.score,
  })
  if (error) throw error
  return data
}

export async function updateOption(optionId: string, patch: { label?: LocalizedText, score?: number }): Promise<void> {
  const { data, error } = await getSupabase()
    .from('diagnostic_options')
    .update(patch)
    .eq('id', optionId)
    .select('id')
  if (error) throw error
  assertAffected(data)
}

export async function deleteOption(optionId: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_delete_diagnostic_option', { p_option_id: optionId })
  if (error) throw error
}
