import { useChallengesStore } from '../store'

// Carga de retos y avance compartida por las vistas de retos.
export function useChallengesData() {
  const store = useChallengesStore()
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
