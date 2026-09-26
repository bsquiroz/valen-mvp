import { useDiagnosticStore } from '@/features/diagnostic/store'
import { nextStep, pillarsByPriority, progressOf, stepsByPillar } from '../data/plan'
import { usePlanStore } from '../store'

// Datos combinados que necesitan las vistas del plan: pasos + prioridad según el último diagnóstico.
export function usePlanData() {
  const planStore = usePlanStore()
  const diagnosticStore = useDiagnosticStore()

  const status = ref<'loading' | 'error' | 'ready'>('loading')

  const latest = computed(() => diagnosticStore.latestResult)
  const steps = computed(() => planStore.steps ?? [])
  const priority = computed(() => (latest.value ? pillarsByPriority(latest.value.scores) : []))
  const groups = computed(() => stepsByPillar(steps.value))
  const progress = computed(() => progressOf(steps.value))
  const next = computed(() => nextStep(steps.value, priority.value))

  async function load() {
    status.value = 'loading'
    try {
      await Promise.all([planStore.load(), diagnosticStore.loadResults()])
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  return { status, latest, steps, priority, groups, progress, next, load }
}
