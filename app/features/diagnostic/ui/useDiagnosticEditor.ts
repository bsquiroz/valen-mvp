import type { LocalizedText } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { tempId } from '@/lib/tempId'
import { saveDiagnostic } from '../api/adminDiagnostic'
import { fetchQuestions } from '../api/diagnostic'
import type { OptionForm, QuestionForm } from '../data/adminForms'
import type { DiagnosticQuestion } from '../data/diagnostic'
import * as ops from '../data/editorOps'

// Estado y operaciones del editor de preguntas del admin.
// Las operaciones solo cambian un borrador local; `save` lo guarda todo en una sola llamada
// (cuida las escrituras en la base) y `discard` vuelve a lo guardado.
export function useDiagnosticEditor() {
  const saved = ref<DiagnosticQuestion[]>([])
  const questions = ref<DiagnosticQuestion[]>([])
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const saving = ref(false)

  const changeCount = computed(() => ops.countDiagnosticChanges(saved.value, questions.value))
  const hasChanges = computed(() => changeCount.value > 0)

  async function load() {
    status.value = 'loading'
    try {
      saved.value = await fetchQuestions({ withScores: true })
      questions.value = saved.value
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function edit(change: (current: DiagnosticQuestion[]) => DiagnosticQuestion[]) {
    if (saving.value) return
    questions.value = change(questions.value)
  }

  // Si falla, el borrador se conserva para reintentar.
  async function save() {
    if (!hasChanges.value || saving.value) return
    saving.value = true
    try {
      await saveDiagnostic(questions.value)
      saved.value = await fetchQuestions({ withScores: true })
      questions.value = saved.value
    }
    finally {
      saving.value = false
    }
  }

  function discard() {
    questions.value = saved.value
  }

  const createQuestion = (pillar: Pillar, form: QuestionForm) =>
    edit(current => ops.addQuestion(current, pillar, form, tempId))

  const updateQuestionPrompt = (questionId: string, prompt: LocalizedText) =>
    edit(current => ops.updateQuestionPrompt(current, questionId, prompt))

  const deleteQuestion = (questionId: string) =>
    edit(current => ops.removeQuestion(current, questionId))

  const reorderQuestions = (pillar: Pillar, orderedIds: string[]) =>
    edit(current => ops.reorderQuestions(current, pillar, orderedIds))

  const moveQuestion = (questionId: string, delta: number) =>
    edit(current => ops.moveQuestion(current, questionId, delta))

  const addOption = (questionId: string, form: OptionForm) =>
    edit(current => ops.addOption(current, questionId, form, tempId))

  const updateOptionLabel = (optionId: string, label: LocalizedText) =>
    edit(current => ops.updateOption(current, optionId, { label }))

  const updateOptionScore = (optionId: string, score: number) =>
    edit(current => ops.updateOption(current, optionId, { score }))

  const deleteOption = (optionId: string) =>
    edit(current => ops.removeOption(current, optionId))

  return {
    questions,
    status,
    saving,
    changeCount,
    hasChanges,
    load,
    save,
    discard,
    createQuestion,
    updateQuestionPrompt,
    deleteQuestion,
    reorderQuestions,
    moveQuestion,
    addOption,
    updateOptionLabel,
    updateOptionScore,
    deleteOption,
  }
}

export type DiagnosticEditor = ReturnType<typeof useDiagnosticEditor>
