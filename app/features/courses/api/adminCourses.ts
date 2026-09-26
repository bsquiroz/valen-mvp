import { getSupabase } from '@/lib/supabase'
import type { AdminCourse } from '../data/adminCourses'
import { mapAdminCourses, toCoursesPayload } from '../data/adminCourses'
import { COURSE_COLUMNS } from '../data/courses'

// El admin ve todos los cursos y lecciones (también los inactivos) y cuántos las completaron.
export async function fetchAdminCourses(): Promise<AdminCourse[]> {
  const supabase = getSupabase()
  const [courses, usage] = await Promise.all([
    supabase.from('courses').select(COURSE_COLUMNS),
    supabase.rpc('admin_lesson_usage'),
  ])
  if (courses.error) throw courses.error
  if (usage.error) throw usage.error
  return mapAdminCourses(courses.data, usage.data)
}

// Guarda el borrador del editor en una sola llamada: la base valida permisos (is_admin) y reglas
// (textos ES/EN, id de video, no borrar lecciones con progreso), escribe solo lo que cambió y
// aplica todo o nada.
export async function saveAdminCourses(courses: AdminCourse[]): Promise<void> {
  const { error } = await getSupabase().rpc('admin_save_courses', { p_courses: toCoursesPayload(courses) })
  if (error) throw error
}
