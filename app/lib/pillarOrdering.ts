import type { Pillar } from './pillars'
import { PILLARS } from './pillars'

// Elementos ordenados por posición dentro de su pilar (preguntas del diagnóstico, pasos del plan…).
export interface PillarItem {
  id: string
  pillar: Pillar
  position: number
}

export function groupByPillar<T extends PillarItem>(items: T[]): Record<Pillar, T[]> {
  const groups = Object.fromEntries(PILLARS.map(pillar => [pillar, [] as T[]])) as Record<Pillar, T[]>
  for (const item of [...items].sort((a, b) => a.position - b.position)) groups[item.pillar].push(item)
  return groups
}

export function nextPosition<T extends PillarItem>(items: T[], pillar: Pillar): number {
  return Math.max(0, ...items.filter(item => item.pillar === pillar).map(item => item.position)) + 1
}

// Ids del pilar en su orden actual.
export function idsInPillar<T extends PillarItem>(items: T[], pillar: Pillar): string[] {
  return items
    .filter(item => item.pillar === pillar)
    .sort((a, b) => a.position - b.position)
    .map(item => item.id)
}

// Reordena los elementos de un pilar según `orderedIds` y renumera sus posiciones desde 1.
// Los ids que falten conservan su orden relativo al final.
export function reorderInPillar<T extends PillarItem>(items: T[], pillar: Pillar, orderedIds: string[]): T[] {
  const rank = (id: string) => {
    const index = orderedIds.indexOf(id)
    return index === -1 ? orderedIds.length : index
  }
  const ordered = idsInPillar(items, pillar).sort((a, b) => rank(a) - rank(b))
  const positions = new Map(ordered.map((id, index) => [id, index + 1]))
  return items.map(item => (positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item))
}

// Mueve un elemento `delta` lugares dentro de su pilar (para mover con teclado).
// Devuelve la misma lista si no hay movimiento.
export function moveInPillar<T extends PillarItem>(items: T[], id: string, delta: number): T[] {
  const item = items.find(candidate => candidate.id === id)
  if (!item) return items
  const ids = idsInPillar(items, item.pillar)
  const from = ids.indexOf(id)
  const to = Math.min(ids.length - 1, Math.max(0, from + delta))
  if (from === to) return items
  ids.splice(from, 1)
  ids.splice(to, 0, id)
  return reorderInPillar(items, item.pillar, ids)
}
