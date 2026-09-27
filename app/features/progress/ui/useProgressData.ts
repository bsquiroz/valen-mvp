import { useChallengesStore } from '@/features/challenges/store'
import { useCoursesStore } from '@/features/courses/store'
import { usePlanStore } from '@/features/plan/store'
import { progressByPillar, totalProgress } from '../data/progress'

// Reúne el avance de plan, cursos y retos. Reutiliza lo que ya cargaron sus stores.
export function useProgressData() {
  const planStore = usePlanStore()
  const coursesStore = useCoursesStore()
  const challengesStore = useChallengesStore()

  const status = ref<'loading' | 'error' | 'ready'>('loading')

  const byPillar = computed(() => progressByPillar({
    planSteps: planStore.steps ?? [],
    courses: coursesStore.courses ?? [],
    completedLessons: coursesStore.completed,
    challenges: challengesStore.challenges ?? [],
    enrollments: challengesStore.enrollments,
  }))
  const total = computed(() => totalProgress(byPillar.value))

  async function load() {
    status.value = 'loading'
    try {
      await Promise.all([planStore.load(), coursesStore.load(), challengesStore.load()])
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  onMounted(load)

  return { status, byPillar, total, load }
}
