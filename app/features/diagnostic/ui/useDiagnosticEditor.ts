import type { LocalizedText } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import * as api from '../api/adminDiagnostic'
import { fetchQuestions } from '../api/diagnostic'
import type { OptionForm, QuestionForm } from '../data/adminForms'
import type { DiagnosticQuestion } from '../data/diagnostic'
import * as ops from '../data/editorOps'

// Estado y operaciones del editor de preguntas del admin.
// Cada operación aplica el cambio en local al instante (optimista), lo guarda en Supabase y
// recarga las preguntas para quedar con los datos reales. Si falla, se revierte y se relanza el error.
export function useDiagnosticEditor() {
  const questions = ref<DiagnosticQuestion[]>([])
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const saving = ref(false)

  const tempId = () => `temp-${crypto.randomUUID()}`

  async function load() {
    status.value = 'loading'
    try {
      questions.value = await fetchQuestions({ withScores: true })
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  async function mutate(local: (current: DiagnosticQuestion[]) => DiagnosticQuestion[], remote: () => Promise<unknown>) {
    const previous = questions.value
    questions.value = local(previous)
    saving.value = true
    try {
      await remote()
    }
    catch (error) {
      questions.value = previous
      throw error
    }
    finally {
      saving.value = false
    }
    questions.value = await fetchQuestions({ withScores: true })
  }

  const createQuestion = (pillar: Pillar, form: QuestionForm) => mutate(
    current => ops.addQuestion(current, pillar, form, tempId),
    () => api.createQuestion(pillar, form),
  )

  const updateQuestionPrompt = (questionId: string, prompt: LocalizedText) => mutate(
    current => ops.updateQuestionPrompt(current, questionId, prompt),
    () => api.updateQuestionPrompt(questionId, prompt),
  )

  const deleteQuestion = (questionId: string) => mutate(
    current => ops.removeQuestion(current, questionId),
    () => api.deleteQuestion(questionId),
  )

  const reorderQuestions = (pillar: Pillar, orderedIds: string[]) => mutate(
    current => ops.reorderQuestions(current, pillar, orderedIds),
    () => api.reorderQuestions(pillar, orderedIds),
  )

  async function moveQuestion(questionId: string, delta: number) {
    const moved = ops.moveQuestion(questions.value, questionId, delta)
    if (moved === questions.value) return
    const question = moved.find(q => q.id === questionId)!
    const orderedIds = moved
      .filter(q => q.pillar === question.pillar)
      .sort((a, b) => a.position - b.position)
      .map(q => q.id)
    await reorderQuestions(question.pillar, orderedIds)
  }

  const addOption = (questionId: string, form: OptionForm) => mutate(
    current => ops.addOption(current, questionId, form, tempId),
    () => api.addOption(questionId, form),
  )

  const updateOptionLabel = (optionId: string, label: LocalizedText) => mutate(
    current => ops.updateOption(current, optionId, { label }),
    () => api.updateOption(optionId, { label }),
  )

  const updateOptionScore = (optionId: string, score: number) => mutate(
    current => ops.updateOption(current, optionId, { score }),
    () => api.updateOption(optionId, { score }),
  )

  const deleteOption = (optionId: string) => mutate(
    current => ops.removeOption(current, optionId),
    () => api.deleteOption(optionId),
  )

  return {
    questions,
    status,
    saving,
    load,
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
