import { z } from 'zod'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextSchema } from '@/lib/localizedText'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'

export interface DiagnosticOption {
  id: string
  label: LocalizedText
  // Solo se pide en vistas de admin
  score?: number
}

export interface DiagnosticQuestion {
  id: string
  pillar: Pillar
  position: number
  prompt: LocalizedText
  options: DiagnosticOption[]
}

// questionId → optionId
export type DiagnosticAnswers = Record<string, string>

export type PillarScores = Record<Pillar, number>

export interface DiagnosticResult {
  id: string
  completedAt: string
  scores: PillarScores
}

export type ScoreLevel = 'low' | 'medium' | 'high'

// Mappers

const questionRowSchema = z.object({
  id: z.string(),
  pillar: z.enum(PILLARS),
  position: z.number(),
  prompt: localizedTextSchema,
  diagnostic_options: z.array(z.object({
    id: z.string(),
    position: z.number(),
    label: localizedTextSchema,
    score: z.number().optional(),
  })),
})

export function mapQuestions(rows: unknown): DiagnosticQuestion[] {
  const questions = z.array(questionRowSchema).parse(rows).map(row => ({
    id: row.id,
    pillar: row.pillar,
    position: row.position,
    prompt: row.prompt,
    options: [...row.diagnostic_options]
      .sort((a, b) => a.position - b.position)
      .map(option => ({
        id: option.id,
        label: option.label,
        ...(option.score !== undefined && { score: option.score }),
      })),
  }))
  return sortQuestions(questions)
}

const pillarScoreRowsSchema = z.array(z.object({
  pillar: z.enum(PILLARS),
  score: z.number(),
}))

// Filas [{pillar, score}] → puntaje de cada pilar (0 si falta).
export function mapPillarScores(rows: unknown): PillarScores {
  const scores = Object.fromEntries(PILLARS.map(pillar => [pillar, 0])) as PillarScores
  for (const { pillar, score } of pillarScoreRowsSchema.parse(rows)) scores[pillar] = score
  return scores
}

const resultRowSchema = z.object({
  id: z.string(),
  completed_at: z.string(),
  diagnostic_scores: z.unknown(),
})

export function mapResults(rows: unknown): DiagnosticResult[] {
  return z.array(resultRowSchema).parse(rows).map(row => ({
    id: row.id,
    completedAt: row.completed_at,
    scores: mapPillarScores(row.diagnostic_scores),
  }))
}

// Selectors

export function sortQuestions(questions: DiagnosticQuestion[]): DiagnosticQuestion[] {
  return [...questions].sort((a, b) =>
    PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar) || a.position - b.position,
  )
}

// Descarta respuestas de preguntas u opciones que ya no existen (p. ej. un borrador viejo).
export function sanitizeAnswers(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): DiagnosticAnswers {
  const clean: DiagnosticAnswers = {}
  for (const question of questions) {
    const optionId = answers[question.id]
    if (optionId && question.options.some(option => option.id === optionId)) clean[question.id] = optionId
  }
  return clean
}

export function answeredCount(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): number {
  return questions.filter(question => answers[question.id]).length
}

export function isDiagnosticComplete(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): boolean {
  return questions.length > 0 && answeredCount(questions, answers) === questions.length
}

// Índice donde retomar: la primera pregunta sin responder (o la última si están todas).
export function resumeIndex(questions: DiagnosticQuestion[], answers: DiagnosticAnswers): number {
  const index = questions.findIndex(question => !answers[question.id])
  return index === -1 ? Math.max(questions.length - 1, 0) : index
}

export function questionsByPillar(questions: DiagnosticQuestion[]): Record<Pillar, DiagnosticQuestion[]> {
  const groups = Object.fromEntries(PILLARS.map(pillar => [pillar, [] as DiagnosticQuestion[]])) as Record<Pillar, DiagnosticQuestion[]>
  for (const question of sortQuestions(questions)) groups[question.pillar].push(question)
  return groups
}

export function toAnswerPayload(questions: DiagnosticQuestion[], answers: DiagnosticAnswers) {
  return questions
    .filter(question => answers[question.id])
    .map(question => ({ question_id: question.id, option_id: answers[question.id]! }))
}

export function scoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'low'
  if (score < 70) return 'medium'
  return 'high'
}

// Pilares con menor puntaje (empates: orden de PILLARS).
export function opportunityAreas(scores: PillarScores, count = 2): Pillar[] {
  return [...PILLARS]
    .sort((a, b) => scores[a] - scores[b] || PILLARS.indexOf(a) - PILLARS.indexOf(b))
    .slice(0, count)
}

// complete_diagnostic / preview_diagnostic rechazan con 22023 cuando las respuestas no coinciden
// con las preguntas activas (p. ej. el admin editó el diagnóstico mientras el usuario respondía).
export function isOutdatedAnswersError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '22023'
}

// complete_diagnostic rechaza un segundo intento (el diagnóstico se responde una sola vez).
export function isAlreadyCompletedError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'hint' in error && error.hint === 'diagnostic_already_completed'
}
