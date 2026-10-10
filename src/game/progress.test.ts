import { describe, expect, it } from 'vitest'
import { bumpWeekly, claimWeekly, rollWeek, weekKey, weeklyTasks, claimDaily, claimGoal, dailyStatus, DAILY_REWARDS, dayKey, GOALS, goalClaimable, hasRewardWaiting, newProgress, noteItems, type GoalContext } from './progress'
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

describe('weekly goals', () => {
  it('starts on Monday and resets when the week changes', () => {
    expect(weekKey(at(2026, 10, 7))).toBe('2026-10-05') // a Wednesday
    expect(weekKey(at(2026, 10, 11, 23))).toBe('2026-10-05') // Sunday night
    expect(weekKey(at(2026, 10, 12))).toBe('2026-10-12')
    let p = bumpWeekly(newProgress(), 'clears', 3, at(2026, 10, 7))
    expect(p.weekly.clears).toBe(3)
    expect(rollWeek(p, at(2026, 10, 9))).toBe(p)
    p = bumpWeekly(p, 'clears', 1, at(2026, 10, 13))
    expect(p.weekly.clears).toBe(1)
  })

  it('pays each task once, then a bonus for finishing all three', () => {
    const now = at(2026, 10, 7)
    const tasks = weeklyTasks(now)
    let p = newProgress()
    expect(claimWeekly(p, 'clears', now)).toBeNull()
    for (const t of tasks) p = bumpWeekly(p, t.id, t.target, now)
    expect(claimWeekly(p, 'bonus', now)).toBeNull() // not yet
    for (const t of tasks) {
      const got = claimWeekly(p, t.id, now)!
      expect(got.reward).toBe(t.reward)
      p = got.progress
      expect(claimWeekly(p, t.id, now)).toBeNull()
    }
    expect(claimWeekly(p, 'bonus', now)!.reward).toBe(200)
  })

  it('gets steadily harder across three rotating weeks', () => {
    const targets = [at(2026, 10, 7), at(2026, 10, 14), at(2026, 10, 21)].map((d) => weeklyTasks(d)[0].target)
    expect(new Set(targets).size).toBe(3)
  })
})

describe('visiting neighbours', () => {
  it('pays a welcome bonus once per shop per day, but always counts the visit', async () => {
    const { visitShop, visitedToday, VISIT_BONUS } = await import('./progress')
    const now = at(2026, 10, 12)
    let p = newProgress()
    const a = visitShop(p, 'b0', now)
    expect(a.bonus).toBe(VISIT_BONUS)
    p = a.progress
    expect(visitedToday(p, now)).toEqual(['b0'])
    const again = visitShop(p, 'b0', now)
    expect(again.bonus).toBe(0)
    expect(again.progress.stats.visits).toBe(2)
    expect(visitShop(again.progress, 'b1', now).bonus).toBe(VISIT_BONUS)
    // a new day starts fresh
    const tomorrow = at(2026, 10, 13)
    expect(visitedToday(p, tomorrow)).toEqual([])
    expect(visitShop(p, 'b0', tomorrow).bonus).toBe(VISIT_BONUS)
  })
})
