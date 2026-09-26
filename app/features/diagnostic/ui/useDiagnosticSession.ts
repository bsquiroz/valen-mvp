import { useAuthStore } from '@/features/auth/store'
import { fetchQuestions } from '../api/diagnostic'
import type { DiagnosticAnswers, DiagnosticQuestion } from '../data/diagnostic'
import { sanitizeAnswers } from '../data/diagnostic'

const DRAFT_KEY_PREFIX = 'diagnostic-draft:'

// Preguntas y respuestas de una sesión del formulario. Con persistDraft las respuestas
// se guardan en este navegador para retomar después (la vista previa de admin no lo usa).
export function useDiagnosticSession(options: { persistDraft: boolean }) {
  const auth = useAuthStore()

  const questions = ref<DiagnosticQuestion[]>([])
  const answers = ref<DiagnosticAnswers>({})

  const draftKey = computed(() => (options.persistDraft && auth.userId ? `${DRAFT_KEY_PREFIX}${auth.userId}` : null))

  function readDraft(): DiagnosticAnswers {
    if (!draftKey.value) return {}
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(draftKey.value) ?? '{}')
      return parsed && typeof parsed === 'object' ? parsed as DiagnosticAnswers : {}
    }
    catch {
      return {}
    }
  }

  function writeDraft() {
    if (!draftKey.value) return
    try {
      if (Object.keys(answers.value).length) localStorage.setItem(draftKey.value, JSON.stringify(answers.value))
      else localStorage.removeItem(draftKey.value)
    }
    catch {
      // Sin storage el borrador solo dura mientras la página esté abierta.
    }
  }

  // `keep`: respuestas en curso a conservar (si no, se usa el borrador guardado).
  async function start(keep?: DiagnosticAnswers) {
    questions.value = await fetchQuestions()
    answers.value = sanitizeAnswers(questions.value, keep ?? readDraft())
    writeDraft()
  }

  function answer(questionId: string, optionId: string) {
    answers.value = { ...answers.value, [questionId]: optionId }
    writeDraft()
  }

  function reset() {
    answers.value = {}
    writeDraft()
  }

  return { questions, answers, start, answer, reset }
}
