import { getSupabase } from '@/lib/supabase'
import type { PlanStep } from '../data/plan'
import { mapPlanSteps } from '../data/plan'

export async function fetchPlanSteps(userId: string): Promise<PlanStep[]> {
  const { data, error } = await getSupabase()
    .from('plan_steps')
    .select('template_id, completed_at, plan_step_templates (pillar, position, kind, title, description)')
    .eq('user_id', userId)
  if (error) throw error
  return mapPlanSteps(data)
}

export async function setPlanStepCompleted(userId: string, templateId: string, completed: boolean): Promise<string | null> {
  const completedAt = completed ? new Date().toISOString() : null
  const { data, error } = await getSupabase()
    .from('plan_steps')
    .update({ completed_at: completedAt })
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .select('completed_at')
  if (error) throw error
  // RLS filtra sin error: 0 filas = no se aplicó
  if (!data?.length) throw new Error('No rows affected')
  return data[0]!.completed_at
}
