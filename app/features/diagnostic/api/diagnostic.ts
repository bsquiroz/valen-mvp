import { getSupabase } from '@/lib/supabase'
import type { DiagnosticAnswers, DiagnosticQuestion, DiagnosticResult, PillarScores } from '../data/diagnostic'
import { mapPillarScores, mapQuestions, mapResults, toAnswerPayload } from '../data/diagnostic'

export async function fetchQuestions(options: { withScores?: boolean } = {}): Promise<DiagnosticQuestion[]> {
  const optionColumns = options.withScores ? 'id, position, label, score' : 'id, position, label'
  const { data, error } = await getSupabase()
    .from('diagnostic_questions')
    .select(`id, pillar, position, prompt, diagnostic_options (${optionColumns})`)
    .eq('is_active', true)
  if (error) throw error
  return mapQuestions(data)
}

// Devuelve el id del intento creado. El puntaje lo calcula la base (complete_diagnostic).
export async function submitDiagnostic(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): Promise<string> {
  const { data, error } = await getSupabase().rpc('complete_diagnostic', {
    p_answers: toAnswerPayload(questions, answers),
  })
  if (error) throw error
  return data
}

// Solo admins: mismo cálculo que el diagnóstico real, sin guardar nada.
export async function previewDiagnostic(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): Promise<PillarScores> {
  const { data, error } = await getSupabase().rpc('preview_diagnostic', {
    p_answers: toAnswerPayload(questions, answers),
  })
  if (error) throw error
  return mapPillarScores(data)
}

// Resultados del usuario, del más reciente al más antiguo.
export async function fetchResults(userId: string, limit = 10): Promise<DiagnosticResult[]> {
  const { data, error } = await getSupabase()
    .from('diagnostic_attempts')
    .select('id, completed_at, diagnostic_scores (pillar, score)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return mapResults(data)
}
