import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { fetchPlanSteps, savePlanProgress } from './api/plan'
import type { PlanDraft, PlanStep } from './data/plan'
import { applyDraft, applySavedProgress, toggleInDraft } from './data/plan'

export const usePlanStore = defineStore('plan', () => {
  const auth = useAuthStore()

  // Pasos tal como están guardados
  const savedSteps = ref<PlanStep[] | null>(null)
  // Avance marcado pero sin guardar (se guarda todo junto con saveProgress)
  const draft = ref<PlanDraft>({})
  const draftStartedAt = ref(new Date().toISOString())
  const saving = ref(false)

  // Lo que ve el usuario: lo guardado con el borrador aplicado
  const steps = computed(() => (savedSteps.value ? applyDraft(savedSteps.value, draft.value, draftStartedAt.value) : null))
  const changeCount = computed(() => Object.keys(draft.value).length)
  const hasChanges = computed(() => changeCount.value > 0)

  async function load(force = false) {
    if (!auth.userId) return
    if (savedSteps.value && !force) return
    savedSteps.value = await fetchPlanSteps(auth.userId)
  }

  // El plan cambia al completar un diagnóstico: la próxima lectura lo vuelve a pedir.
  function invalidate() {
    savedSteps.value = null
    draft.value = {}
  }

  // Solo local: no escribe en la base hasta saveProgress.
  function toggleStep(templateId: string, completed: boolean) {
    if (!savedSteps.value || saving.value) return
    if (!hasChanges.value) draftStartedAt.value = new Date().toISOString()
    draft.value = toggleInDraft(savedSteps.value, draft.value, templateId, completed)
  }

  // Una sola llamada para todos los cambios. Si falla, el borrador se conserva para reintentar.
  async function saveProgress() {
    if (!savedSteps.value || !hasChanges.value || saving.value) return
    saving.value = true
    try {
      const saved = await savePlanProgress(draft.value)
      savedSteps.value = applySavedProgress(savedSteps.value, saved)
      draft.value = {}
    }
    finally {
      saving.value = false
    }
  }

  function discardChanges() {
    draft.value = {}
  }

  watch(() => auth.userId, invalidate)

  return { steps, changeCount, hasChanges, saving, load, invalidate, toggleStep, saveProgress, discardChanges }
})
