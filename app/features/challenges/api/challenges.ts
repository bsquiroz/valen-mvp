import { getSupabase } from '@/lib/supabase'
import type { Challenge, Enrollment } from '../data/challenges'
import { CHALLENGE_COLUMNS, mapChallenges, mapEnrollments } from '../data/challenges'

// Retos visibles para el usuario (la RLS decide: activos o ya empezados).
export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await getSupabase().from('challenges').select(CHALLENGE_COLUMNS)
  if (error) throw error
  return mapChallenges(data)
}

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  const supabase = getSupabase()
  const [enrollments, checkins] = await Promise.all([
    supabase.from('challenge_enrollments').select('challenge_id, target_days, started_at, completed_at').eq('user_id', userId),
    supabase.from('challenge_checkins').select('challenge_id, day').eq('user_id', userId),
  ])
  if (enrollments.error) throw enrollments.error
  if (checkins.error) throw checkins.error
  return mapEnrollments(enrollments.data, checkins.data)
}

// Empezar un reto (idempotente). La base copia la duración del reto.
export async function startChallenge(challengeId: string): Promise<void> {
  const { error } = await getSupabase().rpc('start_challenge', { p_challenge_id: challengeId })
  if (error) throw error
}

// Check-in del día: una escritura al día. La base valida la fecha y completa el reto al llegar a la meta.
export async function checkInChallenge(challengeId: string, day: string): Promise<void> {
  const { error } = await getSupabase().rpc('challenge_check_in', { p_challenge_id: challengeId, p_day: day })
  if (error) throw error
}
