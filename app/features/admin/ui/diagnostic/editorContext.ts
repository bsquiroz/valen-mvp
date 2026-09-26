import type { InjectionKey, Ref } from 'vue'
import type { DiagnosticEditor } from '@/features/diagnostic/ui/useDiagnosticEditor'

// Editor compartido por los ítems de la lista. `activeEditor` asegura que haya un solo
// formulario abierto a la vez (p. ej. 'question:<id>', 'option:<id>', 'new-option:<questionId>').
export interface EditorContext {
  editor: DiagnosticEditor
  activeEditor: Ref<string | null>
  // Ejecuta una operación del editor y muestra el error si falla. Devuelve si tuvo éxito.
  run: (operation: () => unknown) => Promise<boolean>
}

export const editorContextKey: InjectionKey<EditorContext> = Symbol('diagnostic-editor')

export function useEditorContext(): EditorContext {
  const context = inject(editorContextKey)
  if (!context) throw new Error('useEditorContext must be used inside AdminDiagnosticQuestions')
  return context
}
