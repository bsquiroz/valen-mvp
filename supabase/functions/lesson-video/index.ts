// Enlace firmado para reproducir el video de una lección (Bunny Stream, token authentication).
// Solo lo obtiene un usuario con sesión que puede ver la lección (la RLS de lessons lo decide)
// y que ya la desbloqueó (completó la anterior).
// El enlace expira; fuera de la app el reproductor no funciona.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Duración del enlace: alcanza para ver la lección con pausas
const LINK_TTL_SECONDS = 4 * 60 * 60

const requestSchema = z.object({ lessonId: z.uuid() })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'invalid' }, 400)

  const libraryId = Deno.env.get('BUNNY_LIBRARY_ID')
  const tokenKey = Deno.env.get('BUNNY_TOKEN_KEY')
  if (!libraryId || !tokenKey) return json({ error: 'not_configured' }, 500)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'unauthorized' }, 401)

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid' }, 400)

  // Con el token de quien llama: la RLS decide si puede ver la lección
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await caller.auth.getUser()
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401)

  const { data: lesson, error } = await caller
    .from('lessons')
    .select('video_provider, video_id')
    .eq('id', parsed.data.lessonId)
    .maybeSingle()
  if (error) return json({ error: 'unknown' }, 500)
  if (!lesson || lesson.video_provider !== 'bunny') return json({ error: 'not_found' }, 404)

  // Lecciones secuenciales: solo se entrega el video si completó la anterior
  const { data: unlocked, error: unlockedError } = await caller.rpc('lesson_is_unlocked', { p_lesson_id: parsed.data.lessonId })
  if (unlockedError) return json({ error: 'unknown' }, 500)
  if (!unlocked) return json({ error: 'locked' }, 403)

  // Bunny: token = SHA256_HEX(token_key + video_id + expires), expires en segundos UNIX
  const expires = Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS
  const token = await sha256Hex(`${tokenKey}${lesson.video_id}${expires}`)
  const url = new URL(`https://player.mediadelivery.net/embed/${libraryId}/${lesson.video_id}`)
  url.searchParams.set('token', token)
  url.searchParams.set('expires', String(expires))
  url.searchParams.set('autoplay', 'false')
  url.searchParams.set('preload', 'true')
  url.searchParams.set('responsive', 'true')

  return json({ url: url.toString(), expiresAt: new Date(expires * 1000).toISOString() })
})
