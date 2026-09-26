import type { InjectionKey, Ref } from 'vue'
import type { ChallengesEditor } from '@/features/challenges/ui/useChallengesEditor'

// Editor compartido por los ítems de la lista. `activeEditor` asegura que haya un solo
// formulario abierto a la vez ('challenge:<id>' o 'new-challenge:<pillar>').
export interface ChallengesEditorContext {
  editor: ChallengesEditor
  activeEditor: Ref<string | null>
  // Ejecuta una operación del editor y muestra el error si falla. Devuelve si tuvo éxito.
  run: (operation: () => unknown) => Promise<boolean>
}

export const challengesEditorContextKey: InjectionKey<ChallengesEditorContext> = Symbol('challenges-editor')

export function useChallengesEditorContext(): ChallengesEditorContext {
  const context = inject(challengesEditorContextKey)
  if (!context) throw new Error('useChallengesEditorContext must be used inside AdminChallenges')
  return context
}
