// Quién puede entrar a una página. Se declara con definePageMeta({ access }); por defecto 'user'.
export type Access = 'public' | 'guest' | 'user' | 'admin' | 'super_admin'

export const DEFAULT_ACCESS: Access = 'user'

// Solo se aceptan rutas internas para evitar redirecciones abiertas.
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
