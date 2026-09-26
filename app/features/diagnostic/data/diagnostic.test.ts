import { describe, expect, it } from 'vitest'
import type { DiagnosticQuestion } from './diagnostic'
import {
  answeredCount,
  isAlreadyCompletedError,
  isDiagnosticComplete,
  isOutdatedAnswersError,
  mapPillarScores,
  mapQuestions,
  mapResults,
  questionsByPillar,
  opportunityAreas,
  resumeIndex,
  sanitizeAnswers,
  scoreLevel,
  toAnswerPayload,
} from './diagnostic'

const text = (value: string) => ({ es: value, en: value })

function question(id: string, pillar: DiagnosticQuestion['pillar'], position: number): DiagnosticQuestion {
  return {
    id,
    pillar,
    position,
    prompt: text(id),
    options: [{ id: `${id}-a`, label: text('a') }, { id: `${id}-b`, label: text('b') }],
  }
}

const questionsWithoutScore = [{ id: 'f1', pillar: 'finance', position: 1, prompt: text('f1'), diagnostic_options: [
  { id: 'o1', position: 1, label: text('1') },
] }]

const questions = [question('p1', 'psychology', 1), question('f1', 'finance', 1), question('f2', 'finance', 2)]

describe('mapQuestions', () => {
  it('sorts by pillar, position and option position', () => {
    const rows = [
      { id: 'f1', pillar: 'finance', position: 1, prompt: text('f1'), diagnostic_options: [
        { id: 'o2', position: 2, label: text('2') },
        { id: 'o1', position: 1, label: text('1') },
      ] },
      { id: 'p2', pillar: 'psychology', position: 2, prompt: text('p2'), diagnostic_options: [] },
      { id: 'p1', pillar: 'psychology', position: 1, prompt: text('p1'), diagnostic_options: [] },
    ]
    const result = mapQuestions(rows)
    expect(result.map(q => q.id)).toEqual(['p1', 'p2', 'f1'])
    expect(result[2]?.options.map(o => o.id)).toEqual(['o1', 'o2'])
  })

  it('keeps option scores only when requested', () => {
    const rows = [{ id: 'f1', pillar: 'finance', position: 1, prompt: text('f1'), diagnostic_options: [
      { id: 'o1', position: 1, label: text('1'), score: 3 },
    ] }]
    expect(mapQuestions(rows)[0]?.options[0]).toEqual({ id: 'o1', label: text('1'), score: 3 })
    expect(mapQuestions(questionsWithoutScore)[0]?.options[0]).not.toHaveProperty('score')
  })

  it('rejects rows with an unknown pillar', () => {
    expect(() => mapQuestions([{ id: 'x', pillar: 'cooking', position: 1, prompt: text('x'), diagnostic_options: [] }])).toThrow()
  })
})

describe('mapResults', () => {
  it('builds scores for every pillar', () => {
    const [result] = mapResults([{ id: 'r1', completed_at: '2026-09-26T10:00:00Z', diagnostic_scores: [
      { pillar: 'finance', score: 40 },
      { pillar: 'fitness', score: 90 },
    ] }])
    expect(result?.scores).toEqual({ psychology: 0, finance: 40, fitness: 90, relationships: 0 })
  })
})

describe('mapPillarScores', () => {
  it('fills missing pillars with 0 and rejects unknown ones', () => {
    expect(mapPillarScores([{ pillar: 'fitness', score: 55 }])).toEqual({ psychology: 0, finance: 0, fitness: 55, relationships: 0 })
    expect(() => mapPillarScores([{ pillar: 'cooking', score: 1 }])).toThrow()
  })
})

describe('questionsByPillar', () => {
  it('groups sorted questions under every pillar', () => {
    const groups = questionsByPillar([questions[2]!, questions[0]!, questions[1]!])
    expect(groups.finance.map(q => q.id)).toEqual(['f1', 'f2'])
    expect(groups.psychology.map(q => q.id)).toEqual(['p1'])
    expect(groups.fitness).toEqual([])
  })
})

describe('answers', () => {
  const answers = { p1: 'p1-a', f1: 'f1-b', gone: 'x', f2: 'not-an-option' }

  it('drops answers that no longer match a question or option', () => {
    expect(sanitizeAnswers(questions, answers)).toEqual({ p1: 'p1-a', f1: 'f1-b' })
  })

  it('counts progress and completion', () => {
    const clean = sanitizeAnswers(questions, answers)
    expect(answeredCount(questions, clean)).toBe(2)
    expect(isDiagnosticComplete(questions, clean)).toBe(false)
    expect(isDiagnosticComplete(questions, { ...clean, f2: 'f2-a' })).toBe(true)
    expect(isDiagnosticComplete([], {})).toBe(false)
  })

  it('resumes at the first unanswered question', () => {
    expect(resumeIndex(questions, { p1: 'p1-a' })).toBe(1)
    expect(resumeIndex(questions, { p1: 'p1-a', f1: 'f1-a', f2: 'f2-a' })).toBe(2)
    expect(resumeIndex([], {})).toBe(0)
  })

  it('builds the payload for the database', () => {
    expect(toAnswerPayload(questions, { f1: 'f1-a' })).toEqual([{ question_id: 'f1', option_id: 'f1-a' }])
  })
})

describe('scores', () => {
  it('classifies score levels', () => {
    expect(scoreLevel(0)).toBe('low')
    expect(scoreLevel(39)).toBe('low')
    expect(scoreLevel(40)).toBe('medium')
    expect(scoreLevel(70)).toBe('high')
  })

  it('returns the lowest pillars first, ties in pillar order', () => {
    expect(opportunityAreas({ psychology: 50, finance: 20, fitness: 50, relationships: 80 })).toEqual(['finance', 'psychology'])
    expect(opportunityAreas({ psychology: 10, finance: 90, fitness: 30, relationships: 5 }, 1)).toEqual(['relationships'])
  })
})

describe('isOutdatedAnswersError', () => {
  it('detects the invalid answers error code', () => {
    expect(isOutdatedAnswersError({ code: '22023', message: 'answers are incomplete or invalid' })).toBe(true)
    expect(isOutdatedAnswersError({ code: '42501' })).toBe(false)
    expect(isOutdatedAnswersError(new Error('x'))).toBe(false)
    expect(isOutdatedAnswersError(null)).toBe(false)
  })
})

describe('isAlreadyCompletedError', () => {
  it('detects a second attempt', () => {
    expect(isAlreadyCompletedError({ code: 'P0001', hint: 'diagnostic_already_completed' })).toBe(true)
    expect(isAlreadyCompletedError({ code: 'P0001', hint: null })).toBe(false)
    expect(isAlreadyCompletedError(null)).toBe(false)
  })
})
