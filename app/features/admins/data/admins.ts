import { z } from 'zod'
import { PASSWORD_MIN_LENGTH } from '@/features/auth/data/schemas'

// Cuentas con rol admin (las gestiona solo el super admin).
export interface AdminAccount {
  id: string
  email: string
  displayName: string
  createdAt: string
}

const adminAccountRowSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string(),
  created_at: z.string(),
})

export function mapAdminAccounts(rows: unknown): AdminAccount[] {
  return z.array(adminAccountRowSchema).parse(rows).map(row => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  }))
}

// Máximo de bcrypt, el mismo límite que valida la Edge Function
const PASSWORD_MAX_LENGTH = 72

const password = z.string()
  .min(PASSWORD_MIN_LENGTH, { error: 'auth.errors.passwordMin' })
  .max(PASSWORD_MAX_LENGTH, { error: 'admins.errors.passwordMax' })

export const createAdminSchema = z.object({
  displayName: z.string().trim().min(1, { error: 'auth.errors.nameRequired' }).max(80, { error: 'auth.errors.nameMax' }),
  email: z.string().trim().min(1, { error: 'auth.errors.emailRequired' }).pipe(z.email({ error: 'auth.errors.emailInvalid' })),
  password,
})

export const adminPasswordSchema = z.object({ password })

export type CreateAdminInput = z.output<typeof createAdminSchema>

// Códigos de error de la Edge Function admin-users → claves de i18n.
const ADMIN_ERROR_KEYS: Record<string, string> = {
  email_taken: 'admins.errors.emailTaken',
  forbidden: 'admins.errors.forbidden',
  not_found: 'admins.errors.notFound',
}

export function adminErrorKey(code: unknown): string {
  return (typeof code === 'string' && ADMIN_ERROR_KEYS[code]) || 'auth.errors.unknown'
}
