// Único punto de acceso a Supabase. Solo las carpetas `api/` de cada feature importan este archivo.
export function getSupabase() {
  return useSupabaseClient()
}

export function getSupabaseUser() {
  return useSupabaseUser()
}
