import { describe, expect, it } from 'vitest'
import type { Course, Lesson } from './courses'
import {
  adjacentLessons,
  courseDurationSeconds,
  courseProgress,
  coursesByPillar,
  isLessonUnlocked,
  lessonStatus,
  mapCompletedLessons,
  mapCourses,
  resumeLesson,
} from './courses'

const text = (value: string) => ({ es: value, en: value })
const VIDEO = 'b534be45-7bfd-4b55-981a-931ea20dadb5'

function lesson(id: string, position: number, durationSeconds: number | null = 600): Lesson {
  return { id, courseId: 'c1', position, title: text(id), description: null, videoId: VIDEO, durationSeconds, isActive: true }
}

const course: Course = {
  id: 'c1',
  pillar: 'finance',
  position: 1,
  title: text('Finanzas'),
  description: null,
  isActive: true,
  lessons: [lesson('l1', 1), lesson('l2', 2, null), lesson('l3', 3)],
}

describe('mapCourses', () => {
  it('maps courses and sorts their lessons', () => {
    const [mapped] = mapCourses([{
      id: 'c1',
      pillar: 'finance',
      position: 1,
      title: text('Finanzas'),
      description: null,
      is_active: true,
      lessons: [
        { id: 'l2', course_id: 'c1', position: 2, title: text('l2'), description: null, video_id: VIDEO, duration_seconds: null, is_active: true },
        { id: 'l1', course_id: 'c1', position: 1, title: text('l1'), description: text('d'), video_id: VIDEO, duration_seconds: 894, is_active: true },
      ],
    }])
    expect(mapped?.lessons.map(l => l.id)).toEqual(['l1', 'l2'])
    expect(mapped?.lessons[0]).toMatchObject({ courseId: 'c1', videoId: VIDEO, durationSeconds: 894, description: text('d') })
  })

  it('rejects unknown pillars and maps completed lessons', () => {
    expect(() => mapCourses([{ ...course, pillar: 'x', is_active: true, lessons: [] }])).toThrow()
    expect(mapCompletedLessons([{ lesson_id: 'l1' }])).toEqual(new Set(['l1']))
  })
})

describe('selectors', () => {
  const completed = new Set(['l1'])

  it('groups by pillar and hides courses without lessons', () => {
    const groups = coursesByPillar([course, { ...course, id: 'empty', lessons: [] }])
    expect(groups.finance.map(c => c.id)).toEqual(['c1'])
    expect(groups.fitness).toEqual([])
  })

  it('computes progress, minutes and where to resume', () => {
    expect(courseProgress(course, completed)).toEqual({ done: 1, total: 3, percent: 33 })
    expect(courseDurationSeconds(course)).toBe(1200)
    expect(resumeLesson(course, completed)?.id).toBe('l2')
    expect(resumeLesson(course, new Set(['l1', 'l2', 'l3']))?.id).toBe('l1')
  })

  it('finds the previous and next lesson', () => {
    expect(adjacentLessons(course, 'l2')).toMatchObject({ previous: { id: 'l1' }, next: { id: 'l3' } })
    expect(adjacentLessons(course, 'l1').previous).toBeNull()
    expect(adjacentLessons(course, 'missing')).toEqual({ previous: null, next: null })
  })
})

describe('isLessonUnlocked', () => {
  it('unlocks the first lesson and the one after each completed lesson', () => {
    expect(isLessonUnlocked(course, new Set(), 'l1')).toBe(true)
    expect(isLessonUnlocked(course, new Set(), 'l2')).toBe(false)
    expect(isLessonUnlocked(course, new Set(['l1']), 'l2')).toBe(true)
    expect(isLessonUnlocked(course, new Set(['l1']), 'l3')).toBe(false)
  })

  it('keeps completed lessons open even if an earlier one is pending', () => {
    expect(isLessonUnlocked(course, new Set(['l3']), 'l3')).toBe(true)
    expect(isLessonUnlocked(course, new Set(), 'missing')).toBe(false)
  })
})

describe('lessonStatus', () => {
  it('marks completed, available and locked lessons', () => {
    const completed = new Set(['l1'])
    expect(lessonStatus(course, completed, 'l1')).toBe('completed')
    expect(lessonStatus(course, completed, 'l2')).toBe('available')
    expect(lessonStatus(course, completed, 'l3')).toBe('locked')
  })

  it('opens every lesson for admins', () => {
    expect(lessonStatus(course, new Set(), 'l3', true)).toBe('available')
  })
})
