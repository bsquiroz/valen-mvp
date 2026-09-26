import { z } from 'zod'
import type { LocalizedText } from '@/lib/localizedText'
import { formatDuration, parseDuration } from '@/lib/duration'
import { EARLY_ISSUE } from '@/lib/forms'
import { LONG_TEXT_MAX, localizedLongTextInputSchema, localizedTextInputSchema } from '@/lib/localizedText'
import { nextPosition } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import { isTempId } from '@/lib/tempId'
import type { Course, Lesson } from './courses'
import { mapCourses } from './courses'

// Cursos tal como los edita el admin: con cuántos usuarios completaron cada lección.
// Regla: editar nunca quita progreso. Una lección completada por alguien no se borra (se
// desactiva), y un curso con lecciones así tampoco.
export interface AdminLesson extends Lesson {
  users: number
}

export interface AdminCourse extends Omit<Course, 'lessons'> {
  lessons: AdminLesson[]
}

const usageRowSchema = z.object({ lesson_id: z.string(), users: z.number() })

export function mapAdminCourses(rows: unknown, usageRows: unknown): AdminCourse[] {
  const usage = new Map(z.array(usageRowSchema).parse(usageRows).map(row => [row.lesson_id, row.users]))
  return mapCourses(rows).map(course => ({
    ...course,
    lessons: course.lessons.map(lesson => ({ ...lesson, users: usage.get(lesson.id) ?? 0 })),
  }))
}

export function canDeleteLesson(lesson: AdminLesson): boolean {
  return lesson.users === 0
}

export function canDeleteCourse(course: AdminCourse): boolean {
  return course.lessons.every(canDeleteLesson)
}

export function isLessonInUseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'hint' in error && error.hint === 'lesson_in_use'
}

// Formularios

const optionalText = z.string().trim().max(LONG_TEXT_MAX, { error: 'admin.errors.textTooLong' })
const optionalDescription = z.object({ es: optionalText, en: optionalText })

// Descripción opcional: vacía en ambos idiomas = sin descripción; si hay una, van las dos.
function refineDescription(description: { es: string, en: string }, ctx: z.RefinementCtx) {
  if (!description.es && description.en) ctx.addIssue({ code: 'custom', path: ['description', 'es'], message: 'admin.errors.textRequired', params: EARLY_ISSUE })
  if (description.es && !description.en) ctx.addIssue({ code: 'custom', path: ['description', 'en'], message: 'admin.errors.textRequired', params: EARLY_ISSUE })
}

const toDescription = (description: { es: string, en: string }): LocalizedText | null =>
  (description.es ? description : null)

// En los cursos, título y descripción son obligatorios en ambos idiomas
export const courseFormSchema = z.object({
  title: localizedTextInputSchema,
  description: localizedLongTextInputSchema,
})

// Mismo formato que valida la base (id de video de Bunny)
const VIDEO_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const lessonFormSchema = z.object({
  title: localizedTextInputSchema,
  description: optionalDescription,
  videoId: z.string().trim().toLowerCase().regex(VIDEO_ID_PATTERN, { error: 'admin.courses.errors.videoId' }),
  // Texto del input en min:seg (p. ej. "14:54"); vacío = sin duración
  duration: z.string().trim().refine(value => value === '' || parseDuration(value) !== null, {
    error: 'admin.courses.errors.duration',
  }),
}).superRefine((form, ctx) => refineDescription(form.description, ctx))
  .transform(form => ({
    title: form.title,
    description: toDescription(form.description),
    videoId: form.videoId,
    durationSeconds: form.duration === '' ? null : parseDuration(form.duration),
  }))

export type CourseFormInput = z.input<typeof courseFormSchema>
export type CourseForm = z.output<typeof courseFormSchema>
export type LessonFormInput = z.input<typeof lessonFormSchema>
export type LessonForm = z.output<typeof lessonFormSchema>

export function toCourseFormInput(course?: AdminCourse): CourseFormInput {
  return {
    title: { es: course?.title.es ?? '', en: course?.title.en ?? '' },
    description: { es: course?.description?.es ?? '', en: course?.description?.en ?? '' },
  }
}

export function toLessonFormInput(lesson?: AdminLesson): LessonFormInput {
  return {
    title: { es: lesson?.title.es ?? '', en: lesson?.title.en ?? '' },
    description: { es: lesson?.description?.es ?? '', en: lesson?.description?.en ?? '' },
    videoId: lesson?.videoId ?? '',
    duration: lesson?.durationSeconds ? formatDuration(lesson.durationSeconds) : '',
  }
}

// Transformaciones inmutables del borrador

export function addCourse(courses: AdminCourse[], pillar: Pillar, form: CourseForm, id: string): AdminCourse[] {
  return [...courses, { id, pillar, position: nextPosition(courses, pillar), ...form, isActive: true, lessons: [] }]
}

export function updateCourse(
  courses: AdminCourse[],
  id: string,
  patch: Partial<Pick<AdminCourse, 'title' | 'description' | 'isActive'>>,
): AdminCourse[] {
  return courses.map(course => (course.id === id ? { ...course, ...patch } : course))
}

export function removeCourse(courses: AdminCourse[], id: string): AdminCourse[] {
  const course = courses.find(candidate => candidate.id === id)
  if (course && !canDeleteCourse(course)) throw new Error('A course with completed lessons cannot be deleted')
  return courses.filter(candidate => candidate.id !== id)
}

function mapLessons(courses: AdminCourse[], courseId: string, change: (lessons: AdminLesson[]) => AdminLesson[]): AdminCourse[] {
  return courses.map(course => (course.id === courseId ? { ...course, lessons: change(course.lessons) } : course))
}

function renumber(lessons: AdminLesson[]): AdminLesson[] {
  return lessons.map((lesson, index) => (lesson.position === index + 1 ? lesson : { ...lesson, position: index + 1 }))
}

export function addLesson(courses: AdminCourse[], courseId: string, form: LessonForm, id: string): AdminCourse[] {
  return mapLessons(courses, courseId, lessons => [...lessons, {
    id,
    courseId,
    position: lessons.length + 1,
    ...form,
    isActive: true,
    users: 0,
  }])
}

export function updateLesson(
  courses: AdminCourse[],
  lessonId: string,
  patch: Partial<Pick<AdminLesson, 'title' | 'description' | 'videoId' | 'durationSeconds' | 'isActive'>>,
): AdminCourse[] {
  return courses.map(course => (course.lessons.some(lesson => lesson.id === lessonId)
    ? { ...course, lessons: course.lessons.map(lesson => (lesson.id === lessonId ? { ...lesson, ...patch } : lesson)) }
    : course))
}

export function removeLesson(courses: AdminCourse[], lessonId: string): AdminCourse[] {
  return courses.map((course) => {
    const lesson = course.lessons.find(candidate => candidate.id === lessonId)
    if (!lesson) return course
    if (!canDeleteLesson(lesson)) throw new Error('A completed lesson cannot be deleted')
    return { ...course, lessons: renumber(course.lessons.filter(candidate => candidate.id !== lessonId)) }
  })
}

export function reorderLessons(courses: AdminCourse[], courseId: string, orderedIds: string[]): AdminCourse[] {
  const rank = (id: string) => {
    const index = orderedIds.indexOf(id)
    return index === -1 ? orderedIds.length : index
  }
  return mapLessons(courses, courseId, lessons => renumber([...lessons].sort((a, b) => rank(a.id) - rank(b.id))))
}

// Mueve una lección `delta` lugares dentro de su curso (para mover con teclado).
export function moveLesson(courses: AdminCourse[], lessonId: string, delta: number): AdminCourse[] {
  const course = courses.find(candidate => candidate.lessons.some(lesson => lesson.id === lessonId))
  if (!course) return courses
  const ids = course.lessons.map(lesson => lesson.id)
  const from = ids.indexOf(lessonId)
  const to = Math.min(ids.length - 1, Math.max(0, from + delta))
  if (from === to) return courses
  ids.splice(from, 1)
  ids.splice(to, 0, lessonId)
  return reorderLessons(courses, course.id, ids)
}

// Estado completo para admin_save_courses: orden por pilar y posición; lo nuevo va con id null.
export function toCoursesPayload(courses: AdminCourse[]) {
  return [...courses]
    .sort((a, b) => PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar) || a.position - b.position)
    .map(course => ({
      id: isTempId(course.id) ? null : course.id,
      pillar: course.pillar,
      title: course.title,
      description: course.description,
      is_active: course.isActive,
      lessons: course.lessons.map(lesson => ({
        id: isTempId(lesson.id) ? null : lesson.id,
        title: lesson.title,
        description: lesson.description,
        video_id: lesson.videoId,
        duration_seconds: lesson.durationSeconds,
        is_active: lesson.isActive,
      })),
    }))
}

// Cursos con cambios respecto a lo guardado (propios o en sus lecciones).
export function countCourseChanges(saved: AdminCourse[], draft: AdminCourse[]): number {
  const snapshot = (course: AdminCourse) => JSON.stringify([
    course.position,
    course.title,
    course.description,
    course.isActive,
    course.lessons.map(lesson => [lesson.id, lesson.position, lesson.title, lesson.description, lesson.videoId, lesson.durationSeconds, lesson.isActive]),
  ])
  const savedById = new Map(saved.map(course => [course.id, snapshot(course)]))
  const draftIds = new Set(draft.map(course => course.id))
  const removed = saved.filter(course => !draftIds.has(course.id)).length
  const changed = draft.filter(course => savedById.get(course.id) !== snapshot(course)).length
  return removed + changed
}
