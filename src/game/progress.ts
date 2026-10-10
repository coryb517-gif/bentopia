import { allItems, decorScore, hasStorey, levelOf, seatTotal, ITEMS, type Restaurant } from './restaurant'

/**
 * Reasons to come back: a daily reward with a streak, goals that pay coins, and a collection book.
 * Pure rules plus localStorage persistence (moves to the server with the rest of the economy later).
 */
export interface Stats {
  bombs: number
  visits: number
  /** Times the rare guest has dropped by. */
  ashlyndia: number
}

export interface Weekly {
  /** The Monday this week started, like 2026-10-05. */
  week: string
  clears: number
  placed: number
  bombs: number
  claimed: string[]
}

export interface Visits {
  /** The day these visits happened (local date key). */
  day: string
  ids: string[]
}

export interface Progress {
  visits: Visits
  daily: { last: string; streak: number }
  weekly: Weekly
  claimed: string[]
  stats: Stats
  /** Every kind of item the player has ever owned, for the collection book. */
  seen: string[]
}

export const newWeekly = (week = ''): Weekly => ({ week, clears: 0, placed: 0, bombs: 0, claimed: [] })

export const newProgress = (): Progress => ({ visits: { day: '', ids: [] }, daily: { last: '', streak: 0 }, weekly: newWeekly(), claimed: [], stats: { bombs: 0, visits: 0, ashlyndia: 0 }, seen: [] })

// ---------- daily reward ----------
export const DAILY_REWARDS = [30, 40, 50, 60, 80, 100, 200]

/** A local calendar day like 2026-10-06. */
export const dayKey = (now: number): string => {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)

/** Where the streak stands today: can you claim, what day of the week you are on, and what it pays. */
export function dailyStatus(p: Progress, now: number): { canClaim: boolean; day: number; reward: number; streak: number } {
  const today = dayKey(now)
  const gap = p.daily.last ? daysBetween(p.daily.last, today) : Infinity
  const canClaim = gap >= 1
  const streak = gap === 1 ? p.daily.streak : gap === 0 ? p.daily.streak : 0
  const day = canClaim ? (gap === 1 ? p.daily.streak : 0) % DAILY_REWARDS.length : Math.max(0, p.daily.streak - 1) % DAILY_REWARDS.length
  return { canClaim, day, reward: DAILY_REWARDS[day], streak }
}

export function claimDaily(p: Progress, now: number): { progress: Progress; reward: number } | null {
  const s = dailyStatus(p, now)
  if (!s.canClaim) return null
  return { progress: { ...p, daily: { last: dayKey(now), streak: s.streak + 1 } }, reward: s.reward }
}

// ---------- visiting neighbours ----------
/** Coins for the first visit to each neighbouring shop on any given day. */
export const VISIT_BONUS = 12

/** Which shops you have already called on today. */
export const visitedToday = (p: Progress, now: number): string[] => (p.visits.day === dayKey(now) ? p.visits.ids : [])

/** Record a visit. The bonus is only paid the first time you visit that shop today. */
export function visitShop(p: Progress, id: string, now: number): { progress: Progress; bonus: number } {
  const day = dayKey(now)
  const have = visitedToday(p, now)
  const first = !have.includes(id)
  return {
    progress: { ...p, stats: { ...p.stats, visits: p.stats.visits + 1 }, visits: first ? { day, ids: [...have, id] } : { day, ids: have } },
    bonus: first ? VISIT_BONUS : 0,
  }
}

// ---------- weekly goals ----------
/** The Monday of this week, as a local date key. */
export function weekKey(now: number): string {
  const d = new Date(now)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d.getTime())
}

/** Start a fresh week the moment the calendar moves on. Returns the same object if nothing changed. */
export function rollWeek(p: Progress, now: number): Progress {
  const key = weekKey(now)
  return p.weekly.week === key ? p : { ...p, weekly: newWeekly(key) }
}

export type WeeklyKey = 'clears' | 'placed' | 'bombs'

export interface WeeklyTask {
  id: WeeklyKey
  name: string
  target: number
  reward: number
}

export const WEEKLY_BONUS = 200

/** Three tasks that rotate in difficulty from week to week. */
export function weeklyTasks(now: number): WeeklyTask[] {
  const step = Math.floor(Date.parse(weekKey(now) + 'T00:00:00Z') / (7 * 86_400_000)) % 3
  const pick = <T,>(xs: T[]) => xs[step]
  return [
    { id: 'clears', name: `Fill ${pick([5, 8, 12])} orders`, target: pick([5, 8, 12]), reward: pick([80, 110, 150]) },
    { id: 'placed', name: `Place ${pick([3, 5, 7])} new pieces`, target: pick([3, 5, 7]), reward: pick([60, 90, 120]) },
    { id: 'bombs', name: `Set off ${pick([1, 2, 3])} Flavor Bomb${step ? 's' : ''}`, target: pick([1, 2, 3]), reward: pick([60, 90, 120]) },
  ]
}

export function bumpWeekly(p: Progress, key: WeeklyKey, n: number, now: number): Progress {
  const r = rollWeek(p, now)
  return { ...r, weekly: { ...r.weekly, [key]: r.weekly[key] + n } }
}

export const weeklyClaimable = (p: Progress, task: WeeklyTask, now: number): boolean => {
  const w = rollWeek(p, now).weekly
  return w[task.id] >= task.target && !w.claimed.includes(task.id)
}

export const bonusClaimable = (p: Progress, now: number): boolean => {
  const w = rollWeek(p, now).weekly
  return weeklyTasks(now).every((x) => w.claimed.includes(x.id)) && !w.claimed.includes('bonus')
}

export function claimWeekly(p: Progress, id: WeeklyKey | 'bonus', now: number): { progress: Progress; reward: number } | null {
  const r = rollWeek(p, now)
  if (id === 'bonus') {
    if (!bonusClaimable(p, now)) return null
    return { progress: { ...r, weekly: { ...r.weekly, claimed: [...r.weekly.claimed, 'bonus'] } }, reward: WEEKLY_BONUS }
  }
  const task = weeklyTasks(now).find((x) => x.id === id)
  if (!task || !weeklyClaimable(p, task, now)) return null
  return { progress: { ...r, weekly: { ...r.weekly, claimed: [...r.weekly.claimed, id] } }, reward: task.reward }
}

// ---------- goals ----------
export interface GoalContext {
  stars: Record<number, number>
  restaurant: Restaurant
  progress: Progress
}

export interface Goal {
  id: string
  name: string
  blurb: string
  target: number
  reward: number
  value: (c: GoalContext) => number
}

const cleared = (c: GoalContext) => Object.values(c.stars).filter((s) => s > 0).length
const starTotal = (c: GoalContext) => Object.values(c.stars).reduce((n, s) => n + s, 0)
const floors = (c: GoalContext) => 1 + (hasStorey(c.restaurant, 'upstairs') ? 1 : 0) + (hasStorey(c.restaurant, 'rooftop') ? 1 : 0)

const tiers = (id: string, name: (t: number) => string, blurb: (t: number) => string, targets: number[], rewards: number[], value: Goal['value']): Goal[] =>
  targets.map((t, i) => ({ id: `${id}${t}`, name: name(t), blurb: blurb(t), target: t, reward: rewards[i], value }))

export const GOALS: Goal[] = [
  ...tiers('clear', (t) => (t === 1 ? 'First order' : `${t} orders filled`), (t) => `Clear ${t} level${t > 1 ? 's' : ''}`, [1, 6, 12, 24, 36, 48], [20, 40, 60, 100, 150, 300], cleared),
  ...tiers('stars', (t) => `${t} stars`, (t) => `Collect ${t} stars in total`, [10, 40, 80, 120], [30, 70, 120, 250], starTotal),
  ...tiers('rlevel', (t) => `Restaurant level ${t}`, (t) => `Reach restaurant level ${t}`, [2, 4, 6], [50, 120, 250], (c) => levelOf(c.restaurant)),
  ...tiers('decor', (t) => `${t} decor`, (t) => `Reach a decor score of ${t}`, [150, 500, 1200], [40, 100, 220], (c) => decorScore(c.restaurant)),
  ...tiers('seats', (t) => `${t} seats`, (t) => `Seat ${t} diners at once`, [4, 8, 14], [30, 80, 160], (c) => seatTotal(c.restaurant)),
  ...tiers('floors', (t) => (t === 2 ? 'Two storeys' : 'Rooftop dining'), (t) => `Build ${t} floors`, [2, 3], [100, 200], floors),
  ...tiers('bombs', (t) => (t === 1 ? 'Boom!' : `${t} bombs`), (t) => `Set off ${t} Flavor Bomb${t > 1 ? 's' : ''}`, [1, 10, 30], [20, 80, 200], (c) => c.progress.stats.bombs),
  ...tiers('visit', (t) => (t === 1 ? 'Neighbourly' : `${t} visits`), (t) => `Visit ${t} neighbour shop${t > 1 ? 's' : ''}`, [1, 6], [30, 100], (c) => c.progress.stats.visits),
  { id: 'ash1', name: 'A familiar face', blurb: 'Someone special dropped by for a bite...', target: 1, reward: 150, value: (c) => c.progress.stats.ashlyndia },
  ...tiers('book', (t) => `${t} finds`, (t) => `Discover ${t} items for your collection book`, [10, 25, ITEMS.length], [40, 120, 400], (c) => c.progress.seen.length),
]

export const goalValue = (g: Goal, c: GoalContext) => Math.min(g.target, g.value(c))
export const goalDone = (g: Goal, c: GoalContext) => g.value(c) >= g.target
export const goalClaimable = (g: Goal, c: GoalContext) => goalDone(g, c) && !c.progress.claimed.includes(g.id)

export function claimGoal(p: Progress, g: Goal, c: GoalContext): Progress | null {
  if (!goalClaimable(g, { ...c, progress: p })) return null
  return { ...p, claimed: [...p.claimed, g.id] }
}

/** Any reward waiting, for the dot on the header button. */
export const hasRewardWaiting = (c: GoalContext, now: number): boolean =>
  dailyStatus(c.progress, now).canClaim || GOALS.some((g) => goalClaimable(g, c)) || weeklyTasks(now).some((x) => weeklyClaimable(c.progress, x, now)) || bonusClaimable(c.progress, now)

// ---------- collection book ----------
/** Add anything newly placed to the book. Returns the same object when nothing is new. */
export function noteItems(p: Progress, r: Restaurant): Progress {
  const have = new Set(p.seen)
  const fresh = allItems(r).map((i) => i.type as string).filter((t) => !have.has(t))
  if (!fresh.length) return p
  return { ...p, seen: [...p.seen, ...new Set(fresh)] }
}

// ---------- storage ----------
const KEY = 'bentopia.progress'

export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return newProgress()
    const base = newProgress()
    const wk = raw.weekly ?? {}
    return {
      visits: { day: typeof raw.visits?.day === 'string' ? raw.visits.day : '', ids: Array.isArray(raw.visits?.ids) ? raw.visits.ids.filter((x: unknown) => typeof x === 'string') : [] },
      weekly: {
        week: typeof wk.week === 'string' ? wk.week : '',
        clears: Number.isFinite(wk.clears) ? wk.clears : 0,
        placed: Number.isFinite(wk.placed) ? wk.placed : 0,
        bombs: Number.isFinite(wk.bombs) ? wk.bombs : 0,
        claimed: Array.isArray(wk.claimed) ? wk.claimed.filter((x: unknown) => typeof x === 'string') : [],
      },
      daily: { last: typeof raw.daily?.last === 'string' ? raw.daily.last : '', streak: Number.isFinite(raw.daily?.streak) ? Math.max(0, raw.daily.streak) : 0 },
      claimed: Array.isArray(raw.claimed) ? raw.claimed.filter((x: unknown) => typeof x === 'string') : base.claimed,
      stats: {
        bombs: Number.isFinite(raw.stats?.bombs) ? raw.stats.bombs : 0,
        visits: Number.isFinite(raw.stats?.visits) ? raw.stats.visits : 0,
        ashlyndia: Number.isFinite(raw.stats?.ashlyndia) ? raw.stats.ashlyndia : 0,
      },
      seen: Array.isArray(raw.seen) ? raw.seen.filter((x: unknown) => typeof x === 'string') : base.seen,
    }
  } catch {
    return newProgress()
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Storage unavailable: progress lasts this session.
  }
}
