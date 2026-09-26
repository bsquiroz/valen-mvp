import { moveInPillar, reorderInPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { tempId } from '@/lib/tempId'
import * as api from '../api/adminPlan'
import type { PlanStepForm, PlanStepTemplate } from '../data/adminPlan'
import * as ops from '../data/adminPlan'

type TemplatePatch = Partial<Pick<PlanStepTemplate, 'title' | 'description' | 'levels' | 'isActive'>>

// Estado y operaciones del editor de pasos del plan (mismo patrón que el del diagnóstico).
// Las operaciones solo cambian un borrador local; `save` lo guarda todo en una sola llamada
// (cuida las escrituras en la base) y `discard` vuelve a lo guardado.
export function usePlanEditor() {
  const saved = ref<PlanStepTemplate[]>([])
  const templates = ref<PlanStepTemplate[]>([])
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const saving = ref(false)

  const changeCount = computed(() => ops.countPlanChanges(saved.value, templates.value))
  const hasChanges = computed(() => changeCount.value > 0)

  async function load() {
    status.value = 'loading'
    try {
      saved.value = await api.fetchPlanStepTemplates()
      templates.value = saved.value
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function edit(change: (current: PlanStepTemplate[]) => PlanStepTemplate[]) {
    if (saving.value) return
    templates.value = change(templates.value)
  }

  // Si falla, el borrador se conserva para reintentar.
  async function save() {
    if (!hasChanges.value || saving.value) return
    saving.value = true
    try {
      await api.savePlanStepTemplates(templates.value)
      saved.value = await api.fetchPlanStepTemplates()
      templates.value = saved.value
    }
    finally {
      saving.value = false
    }
  }

  function discard() {
    templates.value = saved.value
  }

  const createTemplate = (pillar: Pillar, form: PlanStepForm) =>
    edit(current => ops.addTemplate(current, pillar, form, tempId()))

  const updateTemplate = (id: string, patch: TemplatePatch) =>
    edit(current => ops.updateTemplate(current, id, patch))

  const deleteTemplate = (id: string) =>
    edit(current => ops.removeTemplate(current, id))

  const reorderTemplates = (pillar: Pillar, orderedIds: string[]) =>
    edit(current => reorderInPillar(current, pillar, orderedIds))

  const moveTemplate = (id: string, delta: number) =>
    edit(current => moveInPillar(current, id, delta))

  return {
    templates,
    status,
    saving,
    changeCount,
    hasChanges,
    load,
    save,
    discard,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    moveTemplate,
  }
}

export type PlanEditor = ReturnType<typeof usePlanEditor>
