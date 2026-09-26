import { z } from 'zod'
import type { ThemeName } from '@/features/theme/data/themes'
import { THEMES } from '@/features/theme/data/themes'
import type { Locale } from '@/lib/locales'
import { LOCALES } from '@/lib/locales'

export const ROLES = ['user', 'admin'] as const
export type Role = typeof ROLES[number]

const profileRowSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  role: z.enum(ROLES),
  theme: z.enum(THEMES).nullable(),
  locale: z.enum(LOCALES),
})

export interface Profile {
  id: string
  displayName: string
  role: Role
  // null = sin preferencia guardada
  theme: ThemeName | null
  locale: Locale
}

export type ProfilePreferences = Partial<Pick<Profile, 'displayName' | 'theme' | 'locale'>>

export function mapProfile(row: unknown): Profile {
  const data = profileRowSchema.parse(row)
  return {
    id: data.id,
    displayName: data.display_name,
    role: data.role,
    theme: data.theme,
    locale: data.locale,
  }
}

export function toProfileUpdate(preferences: ProfilePreferences) {
  return {
    ...(preferences.displayName !== undefined && { display_name: preferences.displayName }),
    ...(preferences.theme !== undefined && { theme: preferences.theme }),
    ...(preferences.locale !== undefined && { locale: preferences.locale }),
  }
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}
