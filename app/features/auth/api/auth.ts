import type { ThemeName } from '@/features/theme/data/themes'
import type { Locale } from '@/lib/locales'
import { getSupabase, getSupabaseUser } from '@/lib/supabase'
import type { AuthResult } from '../data/errors'
import { toAuthResult } from '../data/errors'
import type { ForgotPasswordInput, SignInInput, SignUpInput } from '../data/schemas'

function redirectUrl(path: string) {
  return `${window.location.origin}${path}`
}

// Claims (JWT) del usuario actual; reactivo.
export function useCurrentUserClaims() {
  return getSupabaseUser()
}

// Actualiza los claims ya mismo (el módulo lo hace de forma asíncrona tras el cambio de sesión).
async function refreshClaims() {
  const { data } = await getSupabase().auth.getClaims()
  getSupabaseUser().value = data?.claims ?? null
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const { error } = await getSupabase().auth.signInWithPassword(input)
  if (!error) await refreshClaims()
  return toAuthResult(error)
}

export async function signUp(
  input: SignUpInput,
  preferences: { locale: Locale, theme: ThemeName | null },
): Promise<AuthResult> {
  const { error } = await getSupabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: redirectUrl('/auth/confirm'),
      // Lo lee el trigger handle_new_user para crear el perfil
      data: { display_name: input.displayName, ...preferences },
    },
  })
  return toAuthResult(error)
}

export async function resendConfirmation(email: string): Promise<AuthResult> {
  const { error } = await getSupabase().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectUrl('/auth/confirm') },
  })
  return toAuthResult(error)
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<AuthResult> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(input.email, {
    redirectTo: redirectUrl('/auth/update-password'),
  })
  return toAuthResult(error)
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await getSupabase().auth.updateUser({ password })
  return toAuthResult(error)
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut()
  getSupabaseUser().value = null
}
