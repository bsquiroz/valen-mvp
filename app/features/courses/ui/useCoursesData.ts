import { useCoursesStore } from '../store'

// Carga de cursos y progreso compartida por las vistas de cursos.
export function useCoursesData() {
  const store = useCoursesStore()
  const status = ref<'loading' | 'error' | 'ready'>('loading')

  async function load() {
    status.value = 'loading'
    try {
      await store.load()
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  onMounted(load)

  return { store, status, load }
}
