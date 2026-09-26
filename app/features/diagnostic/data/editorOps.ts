import { nextPosition } from '@/lib/pillarOrdering'
import { isTempId } from '@/lib/tempId'
import type { Pillar } from '@/lib/pillars'
import type { LocalizedText } from '@/lib/localizedText'
import { MIN_OPTIONS } from './adminForms'
import type { OptionForm, QuestionForm } from './adminForms'
import type { DiagnosticOption, DiagnosticQuestion } from './diagnostic'

// Transformaciones inmutables de la lista de preguntas del editor de admin.
// Aplican las mismas reglas que la base para que el borrador local se comporte igual.

export function nextQuestionPosition(questions: DiagnosticQuestion[], pillar: Pillar): number {
  return nextPosition(questions, pillar)
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

// Reordenar dentro del pilar (compartido con el editor del plan).
export { moveInPillar as moveQuestion, reorderInPillar as reorderQuestions } from '@/lib/pillarOrdering'

// Estado completo para admin_save_diagnostic: orden por pilar y posición; lo nuevo va con id null.
export function toDiagnosticPayload(questions: DiagnosticQuestion[]) {
  return [...questions]
    .sort((a, b) => a.pillar.localeCompare(b.pillar) || a.position - b.position)
    .map(question => ({
      id: isTempId(question.id) ? null : question.id,
      pillar: question.pillar,
      prompt: question.prompt,
      options: question.options.map(option => ({
        id: isTempId(option.id) ? null : option.id,
        label: option.label,
        score: option.score ?? 0,
      })),
    }))
}

// Preguntas con cambios respecto a lo guardado (nuevas, borradas, movidas o editadas).
export function countDiagnosticChanges(saved: DiagnosticQuestion[], draft: DiagnosticQuestion[]): number {
  const savedById = new Map(saved.map(question => [question.id, question]))
  const draftIds = new Set(draft.map(question => question.id))
  const removed = saved.filter(question => !draftIds.has(question.id)).length
  const changed = draft.filter((question) => {
    const before = savedById.get(question.id)
    return !before
      || before.position !== question.position
      || JSON.stringify([before.prompt, before.options]) !== JSON.stringify([question.prompt, question.options])
  }).length
  return removed + changed
}
