import type { InjectionKey, Ref } from 'vue'
import type { PlanEditor } from '@/features/plan/ui/usePlanEditor'

// Editor compartido por los ítems de la lista. `activeEditor` asegura que haya un solo
// formulario abierto a la vez ('step:<id>' o 'new-step:<pillar>').
export interface PlanEditorContext {
  editor: PlanEditor
  activeEditor: Ref<string | null>
  // Ejecuta una operación del editor y muestra el error si falla. Devuelve si tuvo éxito.
  run: (operation: () => unknown) => Promise<boolean>
}

export const planEditorContextKey: InjectionKey<PlanEditorContext> = Symbol('plan-editor')

export function usePlanEditorContext(): PlanEditorContext {
  const context = inject(planEditorContextKey)
  if (!context) throw new Error('usePlanEditorContext must be used inside AdminPlanSteps')
  return context
}
