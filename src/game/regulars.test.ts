import { describe, expect, it } from 'vitest'
import { addPoints, anyClaimable, claimable, claimTier, newRegulars, POSTCARDS, tierReached, TIERS } from './regulars'
import { CUSTOMERS } from './Customers'

describe('regulars', () => {
  it('every customer has a postcard for every friendship level', () => {
    for (const c of CUSTOMERS) expect(POSTCARDS[c.id]).toHaveLength(TIERS.length)
  })
  it('reaches levels at the thresholds', () => {
    expect([0, 2, 3, 8, 14, 15, 25, 39, 40, 59, 60, 99].map(tierReached)).toEqual([0, 0, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6])
  })
  it('claims one level at a time and pays the right gift', () => {
    let r = addPoints(newRegulars(), 'obaa', 8)
    expect(claimable(r, 'obaa')).toBe(true)
    expect(anyClaimable(r)).toBe(true)
    const a = claimTier(r, 'obaa')!
    expect(a.coins).toBe(40)
    r = a.next
    const b = claimTier(r, 'obaa')!
    expect(b.coins).toBe(80)
    expect(claimTier(b.next, 'obaa')).toBeNull()
    expect(anyClaimable(b.next)).toBe(false)
  })
})

import { STORY_LEVELS } from '../sim/levels'
import { storyCleared, storyUnlocked } from './regulars'
describe('customer stories', () => {
  it('each regular has a story that opens at Regular', () => {
    expect([...new Set(STORY_LEVELS.map((s) => s.customer))].sort()).toEqual(CUSTOMERS.map((c) => c.id).sort())
    for (const c of CUSTOMERS) expect(STORY_LEVELS.filter((s) => s.customer === c.id).map((s) => s.chapter).sort()).toEqual([1, 2, 3])
    expect(new Set(STORY_LEVELS.map((s) => s.id)).size).toBe(STORY_LEVELS.length)
    const r = addPoints(newRegulars(), 'obaa', 7)
    expect(storyUnlocked(r, 'obaa')).toBe(false)
    const r2 = addPoints(r, 'obaa', 1)
    expect(storyUnlocked(r2, 'obaa')).toBe(true)
    expect(storyCleared(r2, 'obaa')).toBe(false)
    expect(storyCleared({ ...r2, story: ['obaa'] }, 'obaa')).toBe(true)
    expect(storyUnlocked(r2, 'obaa', 2)).toBe(false)
    expect(storyUnlocked(addPoints(r2, 'obaa', 7), 'obaa', 2)).toBe(true)
    expect(storyUnlocked(addPoints(r2, 'obaa', 17), 'obaa', 3)).toBe(true)
  })
})
