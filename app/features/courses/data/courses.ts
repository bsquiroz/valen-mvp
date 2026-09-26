import { z } from 'zod'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextSchema } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'

export interface Lesson {
  id: string
  courseId: string
  position: number
  title: LocalizedText
  description: LocalizedText | null
  videoId: string
  durationSeconds: number | null
  isActive: boolean
}

export interface Course {
  id: string
  pillar: Pillar
  position: number
  title: LocalizedText
  description: LocalizedText | null
  isActive: boolean
  // Ordenadas por posición
  lessons: Lesson[]
}

export interface CourseProgress {
  done: number
  total: number
  // 0–100
  percent: number
}

export const COURSE_COLUMNS = 'id, pillar, position, title, description, is_active, lessons (id, course_id, position, title, description, video_id, duration_seconds, is_active)'

const lessonRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  position: z.number(),
  title: localizedTextSchema,
  description: localizedTextSchema.nullable(),
  video_id: z.string(),
  duration_seconds: z.number().nullable(),
  is_active: z.boolean(),
})

const courseRowSchema = z.object({
  id: z.string(),
  pillar: z.enum(PILLARS),
  position: z.number(),
  title: localizedTextSchema,
  description: localizedTextSchema.nullable(),
  is_active: z.boolean(),
  lessons: z.array(lessonRowSchema),
})

export function mapLesson(row: z.output<typeof lessonRowSchema>): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    position: row.position,
    title: row.title,
    description: row.description,
    videoId: row.video_id,
    durationSeconds: row.duration_seconds,
    isActive: row.is_active,
  }
}

export function mapCourses(rows: unknown): Course[] {
  return z.array(courseRowSchema).parse(rows).map(row => ({
    id: row.id,
    pillar: row.pillar,
    position: row.position,
    title: row.title,
    description: row.description,
    isActive: row.is_active,
    lessons: row.lessons.map(mapLesson).sort((a, b) => a.position - b.position),
  }))
}

export function mapCompletedLessons(rows: unknown): Set<string> {
  return new Set(z.array(z.object({ lesson_id: z.string() })).parse(rows).map(row => row.lesson_id))
}

export const videoUrlSchema = z.object({ url: z.url(), expiresAt: z.string() })

export type VideoUrl = z.output<typeof videoUrlSchema>

// Cursos por pilar, en orden. Los cursos sin lecciones visibles no se muestran al usuario.
export function coursesByPillar(courses: Course[]): Record<Pillar, Course[]> {
  const groups = Object.fromEntries(PILLARS.map(pillar => [pillar, [] as Course[]])) as Record<Pillar, Course[]>
  for (const course of [...courses].sort((a, b) => a.position - b.position)) {
    if (course.lessons.length) groups[course.pillar].push(course)
  }
  return groups
}

export function courseProgress(course: Course, completed: Set<string>): CourseProgress {
  const total = course.lessons.length
  const done = course.lessons.filter(lesson => completed.has(lesson.id)).length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

// Duración total en segundos de las lecciones con duración conocida.
export function courseDurationSeconds(course: Course): number {
  return course.lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0)
}

// Primera lección sin completar (o la primera, si ya las completó todas).
export function resumeLesson(course: Course, completed: Set<string>): Lesson | null {
  return course.lessons.find(lesson => !completed.has(lesson.id)) ?? course.lessons[0] ?? null
}

// Lecciones secuenciales (mismo criterio que public.lesson_is_unlocked): se puede abrir una lección
// ya completada, la primera del curso o la que sigue a una completada.
export function isLessonUnlocked(course: Course, completed: Set<string>, lessonId: string): boolean {
  const index = course.lessons.findIndex(lesson => lesson.id === lessonId)
  if (index === -1) return false
  const previous = course.lessons[index - 1]
  return completed.has(lessonId) || !previous || completed.has(previous.id)
}

export type LessonStatus = 'completed' | 'available' | 'locked'

// Estado de una lección en el mapa del curso. `unlockAll`: los admins pueden abrir todas.
export function lessonStatus(course: Course, completed: Set<string>, lessonId: string, unlockAll = false): LessonStatus {
  if (completed.has(lessonId)) return 'completed'
  return unlockAll || isLessonUnlocked(course, completed, lessonId) ? 'available' : 'locked'
}

export function adjacentLessons(course: Course, lessonId: string): { previous: Lesson | null, next: Lesson | null } {
  const index = course.lessons.findIndex(lesson => lesson.id === lessonId)
  if (index === -1) return { previous: null, next: null }
  return { previous: course.lessons[index - 1] ?? null, next: course.lessons[index + 1] ?? null }
}
