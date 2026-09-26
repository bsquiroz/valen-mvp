import type { Pillar } from '@/lib/pillars'
import type { LocalizedText } from '@/lib/localizedText'
import { MIN_OPTIONS } from './adminForms'
import type { OptionForm, QuestionForm } from './adminForms'
import type { DiagnosticOption, DiagnosticQuestion } from './diagnostic'

// Transformaciones inmutables de la lista de preguntas del editor de admin.
// Aplican las mismas reglas que la base para que el borrador local se comporte igual.

export function nextQuestionPosition(questions: DiagnosticQuestion[], pillar: Pillar): number {
  return Math.max(0, ...questions.filter(q => q.pillar === pillar).map(q => q.position)) + 1
}

export function addQuestion(
  questions: DiagnosticQuestion[],
  pillar: Pillar,
  form: QuestionForm,
  newId: () => string,
): DiagnosticQuestion[] {
  const question: DiagnosticQuestion = {
    id: newId(),
    pillar,
    position: nextQuestionPosition(questions, pillar),
    prompt: form.prompt,
    options: form.options.map(option => ({ id: newId(), label: option.label, score: option.score })),
  }
  return [...questions, question]
}

export function updateQuestionPrompt(questions: DiagnosticQuestion[], questionId: string, prompt: LocalizedText): DiagnosticQuestion[] {
  return questions.map(q => (q.id === questionId ? { ...q, prompt } : q))
}

export function removeQuestion(questions: DiagnosticQuestion[], questionId: string): DiagnosticQuestion[] {
  return questions.filter(q => q.id !== questionId)
}

export function addOption(
  questions: DiagnosticQuestion[],
  questionId: string,
  form: OptionForm,
  newId: () => string,
): DiagnosticQuestion[] {
  return questions.map(q => (q.id === questionId
    ? { ...q, options: [...q.options, { id: newId(), label: form.label, score: form.score }] }
    : q))
}

export function updateOption(
  questions: DiagnosticQuestion[],
  optionId: string,
  patch: Partial<Pick<DiagnosticOption, 'label' | 'score'>>,
): DiagnosticQuestion[] {
  return questions.map(q => (q.options.some(o => o.id === optionId)
    ? { ...q, options: q.options.map(o => (o.id === optionId ? { ...o, ...patch } : o)) }
    : q))
}

export function canRemoveOption(question: DiagnosticQuestion): boolean {
  return question.options.length > MIN_OPTIONS
}

export function removeOption(questions: DiagnosticQuestion[], optionId: string): DiagnosticQuestion[] {
  return questions.map((q) => {
    if (!q.options.some(o => o.id === optionId)) return q
    if (!canRemoveOption(q)) throw new Error('A question needs at least two options')
    return { ...q, options: q.options.filter(o => o.id !== optionId) }
  })
}

// Reordena las preguntas de un pilar según `orderedIds` y renumera sus posiciones desde 1.
// Los ids que falten conservan su orden relativo al final.
export function reorderQuestions(questions: DiagnosticQuestion[], pillar: Pillar, orderedIds: string[]): DiagnosticQuestion[] {
  const inPillar = questions
    .filter(q => q.pillar === pillar)
    .sort((a, b) => a.position - b.position)
  const rank = (id: string) => {
    const index = orderedIds.indexOf(id)
    return index === -1 ? orderedIds.length : index
  }
  const ordered = [...inPillar].sort((a, b) => rank(a.id) - rank(b.id))
  const positions = new Map(ordered.map((q, index) => [q.id, index + 1]))
  return questions.map(q => (positions.has(q.id) ? { ...q, position: positions.get(q.id)! } : q))
}

// Mueve una pregunta `delta` lugares dentro de su pilar (para mover con teclado).
export function moveQuestion(questions: DiagnosticQuestion[], questionId: string, delta: number): DiagnosticQuestion[] {
  const question = questions.find(q => q.id === questionId)
  if (!question) return questions
  const ids = questions
    .filter(q => q.pillar === question.pillar)
    .sort((a, b) => a.position - b.position)
    .map(q => q.id)
  const from = ids.indexOf(questionId)
  const to = Math.min(ids.length - 1, Math.max(0, from + delta))
  if (from === to) return questions
  ids.splice(from, 1)
  ids.splice(to, 0, questionId)
  return reorderQuestions(questions, question.pillar, ids)
}
