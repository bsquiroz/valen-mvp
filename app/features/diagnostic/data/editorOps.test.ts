import { describe, expect, it } from 'vitest'
import { tempId } from '@/lib/tempId'
import { emptyQuestionForm, questionFormSchema } from './adminForms'
import type { DiagnosticQuestion } from './diagnostic'
import {
  addOption,
  addQuestion,
  canRemoveOption,
  countDiagnosticChanges,
  moveQuestion,
  nextQuestionPosition,
  removeOption,
  removeQuestion,
  reorderQuestions,
  toDiagnosticPayload,
  updateOption,
  updateQuestionPrompt,
} from './editorOps'

const text = (value: string) => ({ es: value, en: value })

const base: DiagnosticQuestion[] = [
  { id: 'q1', pillar: 'finance', position: 1, prompt: text('q1'), options: [
    { id: 'o1', label: text('a'), score: 0 },
    { id: 'o2', label: text('b'), score: 3 },
  ] },
  { id: 'q2', pillar: 'finance', position: 4, prompt: text('q2'), options: [
    { id: 'o3', label: text('a'), score: 0 },
    { id: 'o4', label: text('b'), score: 1 },
    { id: 'o5', label: text('c'), score: 3 },
  ] },
]

function ids() {
  let n = 0
  return () => `new-${++n}`
}

describe('questions', () => {
  it('appends new questions after the highest position of the pillar', () => {
    expect(nextQuestionPosition(base, 'finance')).toBe(5)
    expect(nextQuestionPosition(base, 'fitness')).toBe(1)

    const form = { ...emptyQuestionForm(), prompt: text('new') }
    const result = addQuestion(base, 'finance', form, ids())
    const added = result.at(-1)!
    expect(added).toMatchObject({ id: 'new-1', pillar: 'finance', position: 5, prompt: text('new') })
    expect(added.options.map(o => o.score)).toEqual([0, 1, 2, 3])
    expect(base).toHaveLength(2)
  })

  it('updates and removes questions without mutating the input', () => {
    expect(updateQuestionPrompt(base, 'q1', text('edited'))[0]?.prompt).toEqual(text('edited'))
    expect(base[0]?.prompt).toEqual(text('q1'))
    expect(removeQuestion(base, 'q1').map(q => q.id)).toEqual(['q2'])
  })
})

describe('options', () => {
  it('adds, edits label and score', () => {
    const added = addOption(base, 'q1', { label: text('c'), score: 2 }, ids())
    expect(added[0]?.options.at(-1)).toEqual({ id: 'new-1', label: text('c'), score: 2 })

    const edited = updateOption(base, 'o4', { score: 2 })
    expect(edited[1]?.options[1]).toEqual({ id: 'o4', label: text('b'), score: 2 })
    expect(updateOption(base, 'o1', { label: text('z') })[0]?.options[0]?.label).toEqual(text('z'))
  })

  it('keeps at least two options per question', () => {
    expect(canRemoveOption(base[0]!)).toBe(false)
    expect(canRemoveOption(base[1]!)).toBe(true)
    expect(removeOption(base, 'o4')[1]?.options.map(o => o.id)).toEqual(['o3', 'o5'])
    expect(() => removeOption(base, 'o1')).toThrow()
  })
})

describe('questionFormSchema', () => {
  it('requires both languages, 2–6 options and scores 0–3', () => {
    const valid = {
      prompt: text('p'),
      options: [{ label: text('a'), score: 0 }, { label: text('b'), score: 3 }],
    }
    expect(questionFormSchema.safeParse(valid).success).toBe(true)
    expect(questionFormSchema.safeParse({ ...valid, prompt: { es: 'p', en: ' ' } }).success).toBe(false)
    expect(questionFormSchema.safeParse({ ...valid, options: valid.options.slice(0, 1) }).success).toBe(false)
    expect(questionFormSchema.safeParse({ ...valid, options: [...valid.options, { label: text('c'), score: 4 }] }).success).toBe(false)
    expect(emptyQuestionForm().options).toHaveLength(4)
  })
})

describe('ordering', () => {
  const three: DiagnosticQuestion[] = [
    ...base,
    { id: 'q3', pillar: 'finance', position: 9, prompt: text('q3'), options: [] },
    { id: 'x1', pillar: 'fitness', position: 1, prompt: text('x1'), options: [] },
  ]
  const order = (list: DiagnosticQuestion[]) => list
    .filter(q => q.pillar === 'finance')
    .sort((a, b) => a.position - b.position)
    .map(q => `${q.id}:${q.position}`)

  it('reorders a pillar and renumbers positions from 1', () => {
    const result = reorderQuestions(three, 'finance', ['q3', 'q1', 'q2'])
    expect(order(result)).toEqual(['q3:1', 'q1:2', 'q2:3'])
    expect(result.find(q => q.id === 'x1')?.position).toBe(1)
  })

  it('moves a newly added question from last to first', () => {
    expect(order(moveQuestion(three, 'q3', -2))).toEqual(['q3:1', 'q1:2', 'q2:3'])
  })

  it('clamps moves at the edges', () => {
    expect(order(moveQuestion(three, 'q1', -1))).toEqual(['q1:1', 'q2:4', 'q3:9'])
    expect(order(moveQuestion(three, 'q3', 5))).toEqual(['q1:1', 'q2:4', 'q3:9'])
  })
})

describe('draft', () => {
  it('builds the full payload ordered by pillar and position, new items without id', () => {
    const draft = addQuestion(base, 'fitness', { prompt: text('n'), options: [{ label: text('a'), score: 0 }, { label: text('b'), score: 3 }] }, tempId)
    const payload = toDiagnosticPayload(reorderQuestions(draft, 'finance', ['q2', 'q1']))
    expect(payload.map(q => q.id)).toEqual(['q2', 'q1', null])
    expect(payload[2]?.options.map(o => o.id)).toEqual([null, null])
    expect(payload[0]?.options[0]).toEqual({ id: 'o3', label: text('a'), score: 0 })
  })

  it('counts questions with changes', () => {
    expect(countDiagnosticChanges(base, base)).toBe(0)
    expect(countDiagnosticChanges(base, updateQuestionPrompt(base, 'q1', text('x')))).toBe(1)
    expect(countDiagnosticChanges(base, updateOption(base, 'o5', { score: 2 }))).toBe(1)
    expect(countDiagnosticChanges(base, removeQuestion(base, 'q1'))).toBe(1)
    expect(countDiagnosticChanges(base, reorderQuestions(base, 'finance', ['q2', 'q1']))).toBe(2)
  })
})
