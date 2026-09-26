import { getSupabase } from '@/lib/supabase'
import type { DiagnosticQuestion } from '../data/diagnostic'
import { toDiagnosticPayload } from '../data/editorOps'

// Guarda el borrador del editor en una sola llamada: la base valida permisos (is_admin) y reglas
// (textos ES/EN, 2–6 opciones, puntaje 0–3), escribe solo lo que cambió y aplica todo o nada.
export async function saveDiagnostic(questions: DiagnosticQuestion[]): Promise<void> {
  const { error } = await getSupabase().rpc('admin_save_diagnostic', {
    p_questions: toDiagnosticPayload(questions),
  })
  if (error) throw error
}
