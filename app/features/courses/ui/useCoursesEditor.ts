import { moveInPillar, reorderInPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { tempId } from '@/lib/tempId'
import { fetchAdminCourses, saveAdminCourses } from '../api/adminCourses'
import type { AdminCourse, AdminLesson, CourseForm, LessonForm } from '../data/adminCourses'
import * as ops from '../data/adminCourses'

type CoursePatch = Partial<Pick<AdminCourse, 'title' | 'description' | 'isActive'>>
type LessonPatch = Partial<Pick<AdminLesson, 'title' | 'description' | 'videoId' | 'durationSeconds' | 'isActive'>>

// Estado y operaciones del editor de cursos (mismo patrón que el del diagnóstico y el plan).
// Las operaciones solo cambian un borrador local; `save` lo guarda todo en una sola llamada.
export function useCoursesEditor() {
  const saved = ref<AdminCourse[]>([])
  const courses = ref<AdminCourse[]>([])
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const saving = ref(false)

  const changeCount = computed(() => ops.countCourseChanges(saved.value, courses.value))
  const hasChanges = computed(() => changeCount.value > 0)

  async function load() {
    status.value = 'loading'
    try {
      saved.value = await fetchAdminCourses()
      courses.value = saved.value
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function edit(change: (current: AdminCourse[]) => AdminCourse[]) {
    if (saving.value) return
    courses.value = change(courses.value)
  }

  // Si falla, el borrador se conserva para reintentar.
  async function save() {
    if (!hasChanges.value || saving.value) return
    saving.value = true
    try {
      await saveAdminCourses(courses.value)
      saved.value = await fetchAdminCourses()
      courses.value = saved.value
    }
    finally {
      saving.value = false
    }
  }

  function discard() {
    courses.value = saved.value
  }

  return {
    courses,
    status,
    saving,
    changeCount,
    hasChanges,
    load,
    save,
    discard,
    createCourse: (pillar: Pillar, form: CourseForm) => edit(current => ops.addCourse(current, pillar, form, tempId())),
    updateCourse: (id: string, patch: CoursePatch) => edit(current => ops.updateCourse(current, id, patch)),
    deleteCourse: (id: string) => edit(current => ops.removeCourse(current, id)),
    reorderCourses: (pillar: Pillar, orderedIds: string[]) => edit(current => reorderInPillar(current, pillar, orderedIds)),
    moveCourse: (id: string, delta: number) => edit(current => moveInPillar(current, id, delta)),
    createLesson: (courseId: string, form: LessonForm) => edit(current => ops.addLesson(current, courseId, form, tempId())),
    updateLesson: (id: string, patch: LessonPatch) => edit(current => ops.updateLesson(current, id, patch)),
    deleteLesson: (id: string) => edit(current => ops.removeLesson(current, id)),
    reorderLessons: (courseId: string, orderedIds: string[]) => edit(current => ops.reorderLessons(current, courseId, orderedIds)),
    moveLesson: (id: string, delta: number) => edit(current => ops.moveLesson(current, id, delta)),
  }
}

export type CoursesEditor = ReturnType<typeof useCoursesEditor>
