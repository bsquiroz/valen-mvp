import { getSupabase } from '@/lib/supabase'
import type { Course, VideoUrl } from '../data/courses'
import { COURSE_COLUMNS, mapCompletedLessons, mapCourses, videoUrlSchema } from '../data/courses'

// Cursos y lecciones visibles para el usuario (la RLS decide: activos o ya empezados).
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await getSupabase().from('courses').select(COURSE_COLUMNS)
  if (error) throw error
  return mapCourses(data)
}

export async function fetchCompletedLessons(userId: string): Promise<Set<string>> {
  const { data, error } = await getSupabase()
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
  if (error) throw error
  return mapCompletedLessons(data)
}

// Una escritura al completar la lección; es definitivo y desbloquea la siguiente.
// user_id y fecha los pone la base, que además exige que la lección esté desbloqueada.
// Idempotente: completar una ya completada no cambia nada.
export async function completeLesson(lessonId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('lesson_progress')
    .upsert({ lesson_id: lessonId }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true })
  if (error) throw error
}

// Enlace firmado y con vencimiento para el reproductor (Edge Function lesson-video).
export async function fetchLessonVideoUrl(lessonId: string): Promise<VideoUrl> {
  const { data, error } = await getSupabase().functions.invoke('lesson-video', { body: { lessonId } })
  if (error) throw error
  return videoUrlSchema.parse(data)
}
