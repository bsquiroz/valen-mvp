import type { Challenge, Enrollment } from '@/features/challenges/data/challenges'
import type { Course } from '@/features/courses/data/courses'
import type { PlanStep, Progress } from '@/features/plan/data/plan'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'

// Fuentes de avance de cada pilar. Las sesiones en vivo se sumarán cuando existan.
export const PROGRESS_SOURCES = ['plan', 'lessons', 'challenges'] as const
export type ProgressSource = typeof PROGRESS_SOURCES[number]

export interface PillarProgress {
  // Promedio de las fuentes que tienen contenido: cada una pesa igual, sin importar cuántos ítems tenga.
  overall: Progress
  sources: Record<ProgressSource, Progress>
  challengesInProgress: number
}

export interface ProgressInput {
  planSteps: PlanStep[]
  courses: Course[]
  completedLessons: Set<string>
  challenges: Challenge[]
  enrollments: Enrollment[]
}

function progress(done: number, total: number): Progress {
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

// Promedio de porcentajes de las fuentes con contenido; done/total suman todos los ítems.
export function overallProgress(sources: Progress[]): Progress {
  const withContent = sources.filter(source => source.total > 0)
  const done = withContent.reduce((sum, source) => sum + source.done, 0)
  const total = withContent.reduce((sum, source) => sum + source.total, 0)
  const percent = withContent.length
    ? Math.round(withContent.reduce((sum, source) => sum + source.percent, 0) / withContent.length)
    : 0
  return { done, total, percent }
}

export function progressByPillar(input: ProgressInput): Record<Pillar, PillarProgress> {
  const enrollmentById = new Map(input.enrollments.map(enrollment => [enrollment.challengeId, enrollment]))

  return Object.fromEntries(PILLARS.map((pillar) => {
    const steps = input.planSteps.filter(step => step.pillar === pillar)
    const lessons = input.courses.filter(course => course.pillar === pillar).flatMap(course => course.lessons)
    const challenges = input.challenges.filter(challenge => challenge.pillar === pillar)
    const challengeEnrollments = challenges.map(challenge => enrollmentById.get(challenge.id))

    const sources: Record<ProgressSource, Progress> = {
      plan: progress(steps.filter(step => step.completedAt).length, steps.length),
      lessons: progress(lessons.filter(lesson => input.completedLessons.has(lesson.id)).length, lessons.length),
      challenges: progress(challengeEnrollments.filter(enrollment => enrollment?.completedAt).length, challenges.length),
    }

    return [pillar, {
      overall: overallProgress(PROGRESS_SOURCES.map(source => sources[source])),
      sources,
      challengesInProgress: challengeEnrollments.filter(enrollment => enrollment && !enrollment.completedAt).length,
    }]
  })) as Record<Pillar, PillarProgress>
}

// Avance de todo el programa: promedio de los pilares que tienen contenido.
export function totalProgress(byPillar: Record<Pillar, PillarProgress>): Progress {
  return overallProgress(PILLARS.map(pillar => byPillar[pillar].overall))
}
