import { describe, expect, it } from 'vitest'
import { claimDaily, claimGoal, dailyStatus, DAILY_REWARDS, dayKey, GOALS, goalClaimable, hasRewardWaiting, newProgress, noteItems, type GoalContext } from './progress'
import { newRestaurant } from './restaurant'
import { ASHLYNDIA, CUSTOMERS, customerFor } from './Customers'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('daily reward', () => {
  it('pays once a day and grows with the streak', () => {
    let p = newProgress()
    const d1 = claimDaily(p, at(2026, 10, 6))!
    expect(d1.reward).toBe(DAILY_REWARDS[0])
    p = d1.progress
    expect(claimDaily(p, at(2026, 10, 6, 20))).toBeNull() // same day
    const d2 = claimDaily(p, at(2026, 10, 7))!
    expect(d2.reward).toBe(DAILY_REWARDS[1])
    expect(d2.progress.daily.streak).toBe(2)
  })

  it('resets after a missed day and wraps after a week', () => {
    let p = newProgress()
    p = claimDaily(p, at(2026, 10, 6))!.progress
    expect(claimDaily(p, at(2026, 10, 9))!.reward).toBe(DAILY_REWARDS[0]) // streak broken
    let q = newProgress()
    for (let i = 0; i < 7; i++) q = claimDaily(q, at(2026, 10, 1 + i))!.progress
    expect(q.daily.streak).toBe(7)
    expect(claimDaily(q, at(2026, 10, 8))!.reward).toBe(DAILY_REWARDS[0])
  })

  it('shows today as claimed with the right day highlighted', () => {
    const p = claimDaily(newProgress(), at(2026, 10, 6))!.progress
    const s = dailyStatus(p, at(2026, 10, 6, 22))
    expect(s.canClaim).toBe(false)
    expect(s.day).toBe(0)
    expect(dayKey(at(2026, 1, 5))).toBe('2026-01-05')
  })
})

describe('goals and the book', () => {
  const ctx = (over: Partial<GoalContext> = {}): GoalContext => ({ stars: {}, restaurant: newRestaurant(0), progress: newProgress(), ...over })

  it('become claimable once reached, and only once', () => {
    const first = GOALS.find((g) => g.id === 'clear1')!
    expect(goalClaimable(first, ctx())).toBe(false)
    const c = ctx({ stars: { 1: 2 } })
    expect(goalClaimable(first, c)).toBe(true)
    const claimed = claimGoal(c.progress, first, c)!
    expect(claimGoal(claimed, first, { ...c, progress: claimed })).toBeNull()
  })

  it('have unique ids and a payout', () => {
    expect(new Set(GOALS.map((g) => g.id)).size).toBe(GOALS.length)
    expect(GOALS.every((g) => g.reward > 0 && g.target > 0)).toBe(true)
  })

  it('collects items as they are placed and flags waiting rewards', () => {
    const p = noteItems(newProgress(), newRestaurant(0))
    expect(p.seen).toEqual(expect.arrayContaining(['table', 'stool', 'lamp', 'bonsai']))
    expect(noteItems(p, newRestaurant(0))).toBe(p)
    expect(hasRewardWaiting(ctx(), at(2026, 10, 6))).toBe(true) // daily is ready
    const done = claimDaily(newProgress(), at(2026, 10, 6))!.progress
    expect(hasRewardWaiting(ctx({ progress: done }), at(2026, 10, 6, 23))).toBe(false)
  })
})

describe('Ashlyndia, the rare guest', () => {
  it('never asks for an order, only drops by', () => {
    expect(CUSTOMERS.some((c) => c.id === 'ashlyndia')).toBe(false)
    expect(Array.from({ length: 48 }, (_, i) => customerFor(i + 1).id)).not.toContain('ashlyndia')
    expect(ASHLYNDIA.name).toBe('Ashlyndia')
  })

  it('unlocks a secret goal the first time she visits', () => {
    const goal = GOALS.find((g) => g.id === 'ash1')!
    const base: GoalContext = { stars: {}, restaurant: newRestaurant(0), progress: newProgress() }
    expect(goalClaimable(goal, base)).toBe(false)
    const met = { ...base, progress: { ...base.progress, stats: { ...base.progress.stats, ashlyndia: 1 } } }
    expect(goalClaimable(goal, met)).toBe(true)
  })
})
