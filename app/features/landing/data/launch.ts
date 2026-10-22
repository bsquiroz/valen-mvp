import type { Pillar } from '@/lib/pillars'

// Datos de la generación en venta. Se actualizan con un commit antes de cada lanzamiento.
export const LAUNCH = {
  startsAt: '2026-11-09T19:00:00-05:00',
  spotsTotal: 100,
  spotsTaken: 73,
  priceCop: 250000,
  sessions: 16,
} as const

// Una semana por pilar, en el orden del programa (no el de PILLARS).
export const PROGRAM_WEEKS: Pillar[] = ['psychology', 'fitness', 'finance', 'relationships']

// Claves de i18n de las listas de la landing (`landing.<sección>.<clave>`).
export const PAIN_KEYS = ['discipline', 'money', 'training', 'presence'] as const
export const OUTCOME_KEYS = ['first', 'second', 'third'] as const
export const SESSION_DAYS = ['mon', 'tue', 'wed', 'thu'] as const
export const INCLUDE_KEYS = ['sessions', 'experts', 'schedule', 'challenges', 'group', 'payment'] as const
export const FAQ_KEYS = ['when', 'duration', 'price', 'missed', 'spots'] as const

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function countdownParts(startMs: number, nowMs: number): CountdownParts {
  const total = Math.max(0, Math.floor((startMs - nowMs) / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

export interface SpotsSummary {
  total: number
  taken: number
  left: number
  // Porcentaje tomado, 0–100.
  pct: number
}

export function spotsSummary(total: number, taken: number): SpotsSummary {
  const safeTotal = Math.max(0, total)
  const safeTaken = Math.min(Math.max(0, taken), safeTotal)
  return {
    total: safeTotal,
    taken: safeTaken,
    left: safeTotal - safeTaken,
    pct: safeTotal === 0 ? 0 : (safeTaken / safeTotal) * 100,
  }
}

// Pesos colombianos sin decimales: `$250.000` en español, `$250,000` en inglés.
export function formatCop(amount: number, locale: string): string {
  const formatted = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', { maximumFractionDigits: 0 }).format(amount)
  return `$${formatted}`
}

export function pricePerSession(price: number, sessions: number): number {
  return sessions > 0 ? price / sessions : price
}
