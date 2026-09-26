import { getSupabase } from '@/lib/supabase'
import type { AdminAccount, CreateAdminInput } from '../data/admins'
import { adminErrorKey, mapAdminAccounts } from '../data/admins'

// Error con la clave de i18n a mostrar.
export class AdminsError extends Error {
  constructor(readonly errorKey: string) {
    super(errorKey)
  }
}

export async function listAdmins(): Promise<AdminAccount[]> {
  const { data, error } = await getSupabase().rpc('super_admin_list_admins')
  if (error) throw error
  return mapAdminAccounts(data)
}

type AdminUsersRequest
  = | { action: 'create' } & CreateAdminInput
    | { action: 'delete', userId: string }
    | { action: 'set-password', userId: string, password: string }

// Crear o borrar cuentas de Auth requiere la service role key: lo hace la Edge Function admin-users,
// que además verifica que quien llama es el super admin.
async function invokeAdminUsers(body: AdminUsersRequest): Promise<void> {
  const { error } = await getSupabase().functions.invoke('admin-users', { body })
  if (!error) return
  // Si la función respondió con error, el cuerpo trae el código: { error: 'email_taken' | ... }
  const response: unknown = 'context' in error ? error.context : null
  const code = response instanceof Response
    ? await response.json().then((payload: { error?: unknown }) => payload.error).catch(() => null)
    : null
  throw new AdminsError(adminErrorKey(code))
}

export function createAdmin(input: CreateAdminInput) {
  return invokeAdminUsers({ action: 'create', ...input })
}

export function deleteAdmin(userId: string) {
  return invokeAdminUsers({ action: 'delete', userId })
}

export function setAdminPassword(userId: string, password: string) {
  return invokeAdminUsers({ action: 'set-password', userId, password })
}
