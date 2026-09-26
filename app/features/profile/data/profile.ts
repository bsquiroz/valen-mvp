import { z } from 'zod'
import type { ThemeName } from '@/features/theme/data/themes'
import { THEMES } from '@/features/theme/data/themes'
import type { Locale } from '@/lib/locales'
import { LOCALES } from '@/lib/locales'

export const ROLES = ['user', 'admin', 'super_admin'] as const
export type Role = typeof ROLES[number]

const profileRowSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  role: z.enum(ROLES),
  theme: z.enum(THEMES).nullable(),
  locale: z.enum(LOCALES),
  last_diagnostic_at: z.string().nullable(),
  diagnostic_retake_allowed: z.boolean(),
})

export interface Profile {
  id: string
  displayName: string
  role: Role
  // null = sin preferencia guardada
  theme: ThemeName | null
  locale: Locale
  lastDiagnosticAt: string | null
  // Un desarrollador habilitó repetir el diagnóstico
  diagnosticRetakeAllowed: boolean
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
    lastDiagnosticAt: data.last_diagnostic_at,
    diagnosticRetakeAllowed: data.diagnostic_retake_allowed,
  }
}

export function toProfileUpdate(preferences: ProfilePreferences) {
  return {
    ...(preferences.displayName !== undefined && { display_name: preferences.displayName }),
    ...(preferences.theme !== undefined && { theme: preferences.theme }),
    ...(preferences.locale !== undefined && { locale: preferences.locale }),
  }
}

// Admin y super admin gestionan el contenido.
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin' || profile?.role === 'super_admin'
}

// Solo el super admin ve los datos de los usuarios y gestiona los admins.
export function isSuperAdmin(profile: Profile | null): boolean {
  return profile?.role === 'super_admin'
}

// El diagnóstico es obligatorio hasta completarlo una vez (los admins quedan exentos).
export function needsDiagnostic(profile: Profile | null): boolean {
  return !!profile && !isAdmin(profile) && !profile.lastDiagnosticAt
}

// El diagnóstico se responde una sola vez, salvo que un desarrollador habilite repetirlo.
export function canTakeDiagnostic(profile: Profile | null): boolean {
  return !!profile && (!profile.lastDiagnosticAt || profile.diagnosticRetakeAllowed)
}
