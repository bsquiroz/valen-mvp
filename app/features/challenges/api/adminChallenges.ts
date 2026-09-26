import { getSupabase } from '@/lib/supabase'
import type { AdminChallenge } from '../data/adminChallenges'
import { mapAdminChallenges, toChallengesPayload } from '../data/adminChallenges'
import { CHALLENGE_COLUMNS } from '../data/challenges'

// El admin ve todos los retos (también los inactivos) y cuántos los empezaron y completaron.
export async function fetchAdminChallenges(): Promise<AdminChallenge[]> {
  const supabase = getSupabase()
  const [challenges, usage] = await Promise.all([
    supabase.from('challenges').select(CHALLENGE_COLUMNS),
    supabase.rpc('admin_challenge_usage'),
  ])
  if (challenges.error) throw challenges.error
  if (usage.error) throw usage.error
  return mapAdminChallenges(challenges.data, usage.data)
}

// Guarda el borrador del editor en una sola llamada (todo o nada; solo escribe lo que cambió).
export async function saveAdminChallenges(challenges: AdminChallenge[]): Promise<void> {
  const { error } = await getSupabase().rpc('admin_save_challenges', { p_challenges: toChallengesPayload(challenges) })
  if (error) throw error
}
