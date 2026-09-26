import { getSupabase } from '@/lib/supabase'
import type { PlanStepTemplate } from '../data/adminPlan'
import { mapPlanStepTemplates, toPlanStepsPayload } from '../data/adminPlan'

export async function fetchPlanStepTemplates(): Promise<PlanStepTemplate[]> {
  const supabase = getSupabase()
  const [templates, usage] = await Promise.all([
    supabase.from('plan_step_templates').select('id, pillar, position, levels, kind, title, description, is_active'),
    supabase.rpc('admin_plan_step_usage'),
  ])
  if (templates.error) throw templates.error
  if (usage.error) throw usage.error
  return mapPlanStepTemplates(templates.data, usage.data)
}

// Guarda el borrador del editor en una sola llamada: la base valida permisos (is_admin) y reglas
// (textos ES/EN, niveles, no borrar pasos en uso), escribe solo lo que cambió y aplica todo o nada.
export async function savePlanStepTemplates(templates: PlanStepTemplate[]): Promise<void> {
  const { error } = await getSupabase().rpc('admin_save_plan_steps', {
    p_steps: toPlanStepsPayload(templates),
  })
  if (error) throw error
}
