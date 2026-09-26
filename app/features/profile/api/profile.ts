import { getSupabase } from '@/lib/supabase'
import type { Profile, ProfilePreferences } from '../data/profile'
import { mapProfile, toProfileUpdate } from '../data/profile'

const PROFILE_COLUMNS = 'id, display_name, role, theme, locale, last_diagnostic_at'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? mapProfile(data) : null
}

export async function updateProfile(userId: string, preferences: ProfilePreferences): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(toProfileUpdate(preferences))
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw error
  return mapProfile(data)
}
