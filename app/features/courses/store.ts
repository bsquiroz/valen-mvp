import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { completeLesson as completeLessonRequest, fetchCompletedLessons, fetchCourses } from './api/courses'
import type { Course } from './data/courses'

export const useCoursesStore = defineStore('courses', () => {
  const auth = useAuthStore()

  const courses = ref<Course[] | null>(null)
  const completed = ref<Set<string>>(new Set())

  async function load(force = false) {
    if (!auth.userId) return
    if (courses.value && !force) return
    const [loadedCourses, loadedCompleted] = await Promise.all([fetchCourses(), fetchCompletedLessons(auth.userId)])
    courses.value = loadedCourses
    completed.value = loadedCompleted
  }

  function courseById(id: string): Course | null {
    return courses.value?.find(course => course.id === id) ?? null
  }

  // Definitivo: desbloquea la siguiente lección del curso
  async function completeLesson(lessonId: string) {
    await completeLessonRequest(lessonId)
    completed.value = new Set(completed.value).add(lessonId)
  }

  // Al cambiar de usuario no se deben ver datos del anterior
  watch(() => auth.userId, () => {
    courses.value = null
    completed.value = new Set()
  })

  return { courses, completed, load, courseById, completeLesson }
})
