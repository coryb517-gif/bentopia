import { describe, expect, it } from 'vitest'
import { addBoosters, addTokens, anyMilestoneReady, claimMilestone, festivalFor, newFestival, rollFestival } from './festival'

describe('festival', () => {
  it('names the festival by month and counts the days left', () => {
    const f = festivalFor('2026-10-24')
    expect(f.id).toBe('2026-10')
    expect(f.name).toBe('Harvest Matsuri')
    expect(f.daysLeft).toBe(8)
    expect(festivalFor('2026-02-28').daysLeft).toBe(1)
  })
  it('collects tokens, pays each milestone once and resets next month', () => {
    let f = addTokens(newFestival(), '2026-10-24', 5)
    expect(anyMilestoneReady(f, '2026-10-24')).toBe(true)
    const c = claimMilestone(f, '2026-10-24', 5)!
    expect(c.reward.coins).toBe(60)
    f = c.next
    expect(claimMilestone(f, '2026-10-24', 5)).toBeNull()
    expect(claimMilestone(f, '2026-10-24', 12)).toBeNull()
    f = addTokens(f, '2026-10-25', 7)
    expect(claimMilestone(f, '2026-10-25', 12)!.reward.knife).toBe(2)
    const next = rollFestival(f, '2026-11-01')
    expect(next.tokens).toBe(0)
    expect(next.claimed).toEqual([])
  })
  it('adds booster charges', () => {
    expect(addBoosters({ knife: 1, shuffle: 0 }, { knife: 2, shuffle: 3 })).toEqual({ knife: 3, shuffle: 3 })
  })
})
