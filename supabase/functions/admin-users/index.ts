// Gestión de admins (solo super admin): crear, eliminar y cambiar contraseña.
// Usa la service role key, que nunca debe llegar al navegador.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const password = z.string().min(8).max(72)

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    email: z.email().max(254),
    password,
    displayName: z.string().trim().min(1).max(80),
  }),
  z.object({ action: z.literal('delete'), userId: z.uuid() }),
  z.object({ action: z.literal('set-password'), userId: z.uuid(), password }),
])

type ErrorCode = 'unauthorized' | 'forbidden' | 'invalid' | 'email_taken' | 'not_found' | 'unknown'

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  invalid: 400,
  email_taken: 409,
  not_found: 404,
  unknown: 500,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(code: ErrorCode) {
  return json({ error: code }, STATUS[code])
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('invalid')

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authorization = req.headers.get('Authorization')
  if (!authorization) return fail('unauthorized')

  // Cliente con el token de quien llama: la verificación de rol la hace la base
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await caller.auth.getUser()
  if (userError || !userData.user) return fail('unauthorized')

  const { data: isSuperAdmin, error: roleError } = await caller.rpc('is_super_admin')
  if (roleError) return fail('unknown')
  if (!isSuperAdmin) return fail('forbidden')

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('invalid')
  const body = parsed.data

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  if (body.action === 'create') {
    const { data, error } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      // El correo lo define el super admin: no se verifica
      email_confirm: true,
      user_metadata: { display_name: body.displayName },
    })
    if (error) return fail(error.code === 'email_exists' ? 'email_taken' : 'unknown')

    const { error: roleUpdateError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', data.user.id)
    if (roleUpdateError) {
      // Sin rol no debe quedar una cuenta huérfana
      await admin.auth.admin.deleteUser(data.user.id)
      return fail('unknown')
    }
    return json({ id: data.user.id })
  }

  // delete / set-password: solo sobre cuentas con rol admin (nunca el super admin ni usuarios)
  if (body.userId === userData.user.id) return fail('forbidden')
  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', body.userId)
    .maybeSingle()
  if (targetError) return fail('unknown')
  if (!target) return fail('not_found')
  if (target.role !== 'admin') return fail('forbidden')

  if (body.action === 'delete') {
    const { error } = await admin.auth.admin.deleteUser(body.userId)
    if (error) return fail('unknown')
    return json({ id: body.userId })
  }

  const { error } = await admin.auth.admin.updateUserById(body.userId, { password: body.password })
  if (error) return fail('unknown')
  return json({ id: body.userId })
})
