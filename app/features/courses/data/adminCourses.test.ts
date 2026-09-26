import { describe, expect, it } from 'vitest'
import type { AdminCourse, AdminLesson } from './adminCourses'
import {
  addCourse,
  addLesson,
  canDeleteCourse,
  countCourseChanges,
  courseFormSchema,
  isLessonInUseError,
  lessonFormSchema,
  mapAdminCourses,
  moveLesson,
  removeCourse,
  removeLesson,
  reorderLessons,
  toCoursesPayload,
  toLessonFormInput,
  updateLesson,
} from './adminCourses'

const text = (value: string) => ({ es: value, en: value })
const VIDEO = 'b534be45-7bfd-4b55-981a-931ea20dadb5'

function lesson(id: string, position: number, users = 0): AdminLesson {
  return { id, courseId: 'c1', position, title: text(id), description: null, videoId: VIDEO, durationSeconds: 600, isActive: true, users }
}

const course: AdminCourse = {
  id: 'c1',
  pillar: 'finance',
  position: 1,
  title: text('c1'),
  description: null,
  isActive: true,
  lessons: [lesson('l1', 1), lesson('l2', 2, 3), lesson('l3', 3)],
}
const base = [course]
const order = (courses: AdminCourse[]) => courses[0]!.lessons.map(l => `${l.id}:${l.position}`)

describe('mapAdminCourses', () => {
  it('joins lesson usage', () => {
    const [mapped] = mapAdminCourses([{
      id: 'c1', pillar: 'finance', position: 1, title: text('c'), description: null, is_active: true,
      lessons: [{ id: 'l1', course_id: 'c1', position: 1, title: text('l'), description: null, video_id: VIDEO, duration_seconds: null, is_active: true }],
    }], [{ lesson_id: 'l1', users: 4 }])
    expect(mapped?.lessons[0]?.users).toBe(4)
  })
})

describe('lessonFormSchema', () => {
  const valid = { title: text('t'), description: { es: '', en: '' }, videoId: ` ${VIDEO.toUpperCase()} `, duration: '14:54' }

  it('normalizes the video id and duration', () => {
    const result = lessonFormSchema.safeParse(valid)
    expect(result.success && result.data).toEqual({ title: text('t'), description: null, videoId: VIDEO, durationSeconds: 894 })
    const noDuration = lessonFormSchema.safeParse({ ...valid, duration: '' })
    expect(noDuration.success && noDuration.data.durationSeconds).toBeNull()
  })

  it('rejects invalid ids, durations and half descriptions', () => {
    const messages = (input: typeof valid) => {
      const result = lessonFormSchema.safeParse(input)
      return result.success ? [] : result.error.issues.map(issue => issue.message)
    }
    expect(messages({ ...valid, videoId: 'abc' })).toEqual(['admin.courses.errors.videoId'])
    expect(messages({ ...valid, duration: '14:75' })).toEqual(['admin.courses.errors.duration'])
    expect(messages({ ...valid, description: { es: 'd', en: '' } })).toEqual(['admin.errors.textRequired'])
  })

  it('builds form values from a lesson', () => {
    expect(toLessonFormInput(lesson('l1', 1))).toMatchObject({ videoId: VIDEO, duration: '10:00' })
    expect(toLessonFormInput().duration).toBe('')
  })
})

describe('editor ops', () => {
  it('adds courses at the end of the pillar and lessons at the end of the course', () => {
    const withCourse = addCourse(base, 'finance', { title: text('n'), description: text('d') }, 'temp-c')
    expect(withCourse.at(-1)).toMatchObject({ id: 'temp-c', position: 2, isActive: true, lessons: [] })
    const withLesson = addLesson(base, 'c1', { title: text('n'), description: null, videoId: VIDEO, durationSeconds: null }, 'temp-l')
    expect(withLesson[0]?.lessons.at(-1)).toMatchObject({ id: 'temp-l', position: 4, users: 0 })
  })

  it('protects progress: completed lessons and their courses cannot be deleted', () => {
    expect(canDeleteCourse(course)).toBe(false)
    expect(() => removeCourse(base, 'c1')).toThrow()
    expect(() => removeLesson(base, 'l2')).toThrow()
    expect(order(removeLesson(base, 'l1'))).toEqual(['l2:1', 'l3:2'])
  })

  it('reorders and moves lessons within the course', () => {
    expect(order(reorderLessons(base, 'c1', ['l3', 'l1', 'l2']))).toEqual(['l3:1', 'l1:2', 'l2:3'])
    expect(order(moveLesson(base, 'l3', -2))).toEqual(['l3:1', 'l1:2', 'l2:3'])
    expect(moveLesson(base, 'l1', -1)).toBe(base)
  })

  it('updates lessons without mutating', () => {
    expect(updateLesson(base, 'l2', { isActive: false })[0]?.lessons[1]?.isActive).toBe(false)
    expect(course.lessons[1]?.isActive).toBe(true)
  })
})

describe('draft', () => {
  it('builds the full payload, new items without id', () => {
    const draft = addLesson(base, 'c1', { title: text('n'), description: null, videoId: VIDEO, durationSeconds: null }, 'temp-l')
    const [payload] = toCoursesPayload(draft)
    expect(payload?.lessons.map(l => l.id)).toEqual(['l1', 'l2', 'l3', null])
    expect(payload?.lessons[0]).toEqual({ id: 'l1', title: text('l1'), description: null, video_id: VIDEO, duration_seconds: 600, is_active: true })
  })

  it('counts courses with changes', () => {
    expect(countCourseChanges(base, base)).toBe(0)
    expect(countCourseChanges(base, updateLesson(base, 'l1', { durationSeconds: 12 }))).toBe(1)
    expect(countCourseChanges(base, addCourse(base, 'fitness', { title: text('n'), description: text('d') }, 'temp-c'))).toBe(1)
  })

  it('detects the in-use error from the database', () => {
    expect(isLessonInUseError({ hint: 'lesson_in_use' })).toBe(true)
    expect(isLessonInUseError({ hint: null })).toBe(false)
  })
})

describe('courseFormSchema', () => {
  const filled = { title: text('t'), description: { es: 'Una descripción larga', en: 'A long description' } }

  it('requires title and description in both languages', () => {
    expect(courseFormSchema.safeParse(filled).success).toBe(true)
    expect(courseFormSchema.safeParse({ ...filled, description: { es: 'd', en: ' ' } }).success).toBe(false)
    expect(courseFormSchema.safeParse({ ...filled, description: { es: 'x'.repeat(2001), en: 'd' } }).success).toBe(false)
  })
})
