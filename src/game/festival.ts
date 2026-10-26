/**
 * A festival every month. Clearing levels earns festival tokens; milestones pay coins and free boosters.
 * Tokens reset with the month, so there is always a fresh reason to come back.
 */
import type { ItemType } from './restaurant'

/** 'season' stands for the decor item of the current season. */
export type PrizeSlot = ItemType | 'season'

export interface Reward {
  item?: ItemType
  coins?: number
  knife?: number
  shuffle?: number
}

export interface Milestone {
  at: number
  coins?: number
  knife?: number
  shuffle?: number
  item?: PrizeSlot
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

/** The season for a local day like 2026-10-26. */
export const seasonOf = (day: string): Season => {
  const m = Number(day.split('-')[1])
  return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn'
}

export const SEASON_ITEM: Record<Season, ItemType> = { winter: 'snowman', spring: 'koinobori', summer: 'goldfish', autumn: 'tsukimi' }

/** The decor item a milestone pays on a given day. */
export const prizeItem = (m: Milestone, day: string): ItemType | undefined => (m.item === 'season' ? SEASON_ITEM[seasonOf(day)] : m.item)

export const MILESTONES: Milestone[] = [
  { at: 5, coins: 60 },
  { at: 12, knife: 2 },
  { at: 22, coins: 150, item: 'season' },
  { at: 35, shuffle: 3, item: 'festlantern' },
  { at: 50, coins: 400, knife: 2, shuffle: 2, item: 'mikoshi' },
]

const THEMES: { name: string; icon: string }[] = [
  { name: 'Snow Lantern Night', icon: '🏮' },
  { name: 'Plum Blossom Fair', icon: '🌸' },
  { name: 'Hanami Picnic', icon: '🌸' },
  { name: 'Spring Feast', icon: '🍡' },
  { name: 'Koinobori Day', icon: '🎏' },
  { name: 'Rainy Season Tea', icon: '☔' },
  { name: 'Tanabata Star Night', icon: '🎋' },
  { name: 'Summer Fireworks', icon: '🎆' },
  { name: 'Tsukimi Moon Festival', icon: '🌕' },
  { name: 'Harvest Matsuri', icon: '🌾' },
  { name: 'Maple Moon Walk', icon: '🍁' },
  { name: 'Winter Lights', icon: '✨' },
]

/** The festival for a local day like 2026-10-24: its id, name, and how many days remain including today. */
export function festivalFor(day: string): { id: string; name: string; icon: string; daysLeft: number } {
  const [y, m, d] = day.split('-').map(Number)
  const theme = THEMES[(m - 1 + 12) % 12]
  const monthDays = new Date(y, m, 0).getDate()
  return { id: `${y}-${String(m).padStart(2, '0')}`, ...theme, daysLeft: monthDays - d + 1 }
}

export interface FestivalState {
  /** The festival these tokens belong to. */
  id: string
  tokens: number
  /** Milestone thresholds already claimed. */
  claimed: number[]
}

export interface Boosters {
  knife: number
  shuffle: number
}

const KEY = 'bentopia.festival'
const BKEY = 'bentopia.boosters'

export const newFestival = (id = ''): FestivalState => ({ id, tokens: 0, claimed: [] })
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)

export function loadFestival(): FestivalState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!raw || typeof raw.id !== 'string') return newFestival()
    return { id: raw.id, tokens: num(raw.tokens), claimed: Array.isArray(raw.claimed) ? raw.claimed.filter((x: unknown) => typeof x === 'number') : [] }
  } catch {
    return newFestival()
  }
}

export function loadBoosters(): Boosters {
  try {
    const raw = JSON.parse(localStorage.getItem(BKEY) ?? 'null')
    return { knife: num(raw?.knife), shuffle: num(raw?.shuffle) }
  } catch {
    return { knife: 0, shuffle: 0 }
  }
}

/** Festival prizes the player owns but has not placed yet. */
export type Gifts = Partial<Record<string, number>>
const GKEY = 'bentopia.gifts'

export function loadGifts(): Gifts {
  try {
    const raw = JSON.parse(localStorage.getItem(GKEY) ?? 'null')
    const g: Gifts = {}
    if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (num(v) > 0) g[k] = num(v)
    return g
  } catch {
    return {}
  }
}

export const addGift = (g: Gifts, item?: ItemType): Gifts => (item ? { ...g, [item]: (g[item] ?? 0) + 1 } : g)

/** Take one copy out of the stock. Returns null when there is none. */
export function takeGift(g: Gifts, item: string): Gifts | null {
  const n = g[item] ?? 0
  if (n <= 0) return null
  const next = { ...g, [item]: n - 1 }
  if (n - 1 === 0) delete next[item]
  return next
}

export function save(f: FestivalState, b: Boosters, g: Gifts = {}) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f))
    localStorage.setItem(BKEY, JSON.stringify(b))
    localStorage.setItem(GKEY, JSON.stringify(g))
  } catch {
    /* storage unavailable */
  }
}

/** Start a fresh festival when the month has turned over. */
export const rollFestival = (f: FestivalState, day: string): FestivalState => (f.id === festivalFor(day).id ? f : newFestival(festivalFor(day).id))

export const addTokens = (f: FestivalState, day: string, n: number): FestivalState => {
  const cur = rollFestival(f, day)
  return { ...cur, tokens: cur.tokens + n }
}

export const milestoneReady = (f: FestivalState, m: Milestone) => f.tokens >= m.at && !f.claimed.includes(m.at)
export const anyMilestoneReady = (f: FestivalState, day: string) => {
  const cur = rollFestival(f, day)
  return MILESTONES.some((m) => milestoneReady(cur, m))
}

export function claimMilestone(f: FestivalState, day: string, at: number): { next: FestivalState; reward: Reward } | null {
  const cur = rollFestival(f, day)
  const m = MILESTONES.find((x) => x.at === at)
  if (!m || !milestoneReady(cur, m)) return null
  return { next: { ...cur, claimed: [...cur.claimed, at] }, reward: { coins: m.coins, knife: m.knife, shuffle: m.shuffle, item: prizeItem(m, day) } }
}

export const addBoosters = (b: Boosters, r: Reward): Boosters => ({ knife: b.knife + (r.knife ?? 0), shuffle: b.shuffle + (r.shuffle ?? 0) })
