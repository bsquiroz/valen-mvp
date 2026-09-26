import { describe, expect, it } from 'vitest'
import type { PillarItem } from './pillarOrdering'
import { groupByPillar, idsInPillar, moveInPillar, nextPosition, reorderInPillar } from './pillarOrdering'

const items: PillarItem[] = [
  { id: 'b', pillar: 'finance', position: 4 },
  { id: 'a', pillar: 'finance', position: 1 },
  { id: 'x', pillar: 'fitness', position: 1 },
]

describe('pillarOrdering', () => {
  it('groups by pillar sorted by position', () => {
    const groups = groupByPillar(items)
    expect(groups.finance.map(item => item.id)).toEqual(['a', 'b'])
    expect(groups.fitness.map(item => item.id)).toEqual(['x'])
    expect(groups.psychology).toEqual([])
  })

  it('computes the next position and current order of a pillar', () => {
    expect(nextPosition(items, 'finance')).toBe(5)
    expect(nextPosition(items, 'relationships')).toBe(1)
    expect(idsInPillar(items, 'finance')).toEqual(['a', 'b'])
  })

  it('reorders and moves within a pillar only', () => {
    const reordered = reorderInPillar(items, 'finance', ['b', 'a'])
    expect(idsInPillar(reordered, 'finance')).toEqual(['b', 'a'])
    expect(reordered.find(item => item.id === 'x')?.position).toBe(1)
    expect(idsInPillar(moveInPillar(items, 'b', -1), 'finance')).toEqual(['b', 'a'])
    expect(moveInPillar(items, 'a', -1)).toBe(items)
  })
})
