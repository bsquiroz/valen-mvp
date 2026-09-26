import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { fetchPlanSteps, setPlanStepCompleted } from './api/plan'
import type { PlanStep } from './data/plan'
import { setStepCompleted } from './data/plan'

export const usePlanStore = defineStore('plan', () => {
  const auth = useAuthStore()

  const steps = ref<PlanStep[] | null>(null)

  async function load(force = false) {
    if (!auth.userId) return
    if (steps.value && !force) return
    steps.value = await fetchPlanSteps(auth.userId)
  }

  // El plan cambia al completar un diagnóstico: la próxima lectura lo vuelve a pedir.
  function invalidate() {
    steps.value = null
  }

  // Optimista: se marca al instante y se revierte si falla.
  async function toggleStep(templateId: string, completed: boolean) {
    if (!auth.userId || !steps.value) return
    const previous = steps.value
    steps.value = setStepCompleted(previous, templateId, completed ? new Date().toISOString() : null)
    try {
      const completedAt = await setPlanStepCompleted(auth.userId, templateId, completed)
      steps.value = setStepCompleted(steps.value, templateId, completedAt)
    }
    catch (error) {
      steps.value = previous
      throw error
    }
  }

  watch(() => auth.userId, invalidate)

  return { steps, load, invalidate, toggleStep }
})
