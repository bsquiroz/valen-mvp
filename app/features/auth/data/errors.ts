export type AuthResult = { ok: true } | { ok: false, errorKey: string }

// Códigos de error de Supabase Auth → claves de i18n.
const AUTH_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  user_already_exists: 'auth.errors.userAlreadyExists',
  email_exists: 'auth.errors.userAlreadyExists',
  weak_password: 'auth.errors.weakPassword',
  same_password: 'auth.errors.samePassword',
  over_email_send_rate_limit: 'auth.errors.rateLimit',
  over_request_rate_limit: 'auth.errors.rateLimit',
}

export function authErrorKey(code: string | null | undefined): string {
  return (code && AUTH_ERROR_KEYS[code]) || 'auth.errors.unknown'
}

export function toAuthResult(error: { code?: string } | null): AuthResult {
  return error ? { ok: false, errorKey: authErrorKey(error.code) } : { ok: true }
}
