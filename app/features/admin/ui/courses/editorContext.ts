import type { InjectionKey, Ref } from 'vue'
import type { CoursesEditor } from '@/features/courses/ui/useCoursesEditor'

// Editor compartido por los ítems de la lista. `activeEditor` asegura que haya un solo
// formulario abierto a la vez ('course:<id>', 'new-course:<pillar>', 'lesson:<id>', 'new-lesson:<courseId>').
export interface CoursesEditorContext {
  editor: CoursesEditor
  activeEditor: Ref<string | null>
  // Ejecuta una operación del editor y muestra el error si falla. Devuelve si tuvo éxito.
  run: (operation: () => unknown) => Promise<boolean>
}

export const coursesEditorContextKey: InjectionKey<CoursesEditorContext> = Symbol('courses-editor')

export function useCoursesEditorContext(): CoursesEditorContext {
  const context = inject(coursesEditorContextKey)
  if (!context) throw new Error('useCoursesEditorContext must be used inside AdminCourses')
  return context
}
