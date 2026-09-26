import { getSupabase } from '@/lib/supabase'
import type { PlanDraft, PlanStep, SavedProgress } from '../data/plan'
import { mapPlanSteps, mapSavedProgress, toProgressPayload } from '../data/plan'

export async function fetchPlanSteps(userId: string): Promise<PlanStep[]> {
  const { data, error } = await getSupabase()
    .from('plan_steps')
    .select('template_id, completed_at, plan_step_templates (pillar, position, kind, title, description)')
    .eq('user_id', userId)
  if (error) throw error
  return mapPlanSteps(data)
}

// Guarda todos los cambios del borrador en una sola llamada (todo o nada; las fechas las pone la base).
export async function savePlanProgress(draft: PlanDraft): Promise<SavedProgress[]> {
  const { data, error } = await getSupabase().rpc('save_plan_progress', {
    p_changes: toProgressPayload(draft),
  })
  if (error) throw error
  return mapSavedProgress(data)
}
