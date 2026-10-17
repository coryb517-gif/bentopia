import { dailyNumber } from '../sim/daily'

/** How the player is doing on the Daily Challenge. Lives in this browser until accounts arrive. */
export interface DailyRecord {
  /** Local day of the best result. */
  day: string
  stars: number
  movesLeft: number
  /** Consecutive days with a win, counted up to `lastWin`. */
  streak: number
  lastWin: string
}

export const DAILY_COINS = 40
const KEY = 'bentopia.dailychallenge'

export const newDailyRecord = (): DailyRecord => ({ day: '', stars: 0, movesLeft: 0, streak: 0, lastWin: '' })

export function loadDailyRecord(): DailyRecord {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    const b = newDailyRecord()
    if (!raw || typeof raw !== 'object') return b
    return {
      day: typeof raw.day === 'string' ? raw.day : '',
      stars: Number.isFinite(raw.stars) ? raw.stars : 0,
      movesLeft: Number.isFinite(raw.movesLeft) ? raw.movesLeft : 0,
      streak: Number.isFinite(raw.streak) ? Math.max(0, raw.streak) : 0,
      lastWin: typeof raw.lastWin === 'string' ? raw.lastWin : '',
    }
  } catch {
    return newDailyRecord()
  }
}

export function saveDailyRecord(d: DailyRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage unavailable */
  }
}

const gap = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)

export const wonToday = (d: DailyRecord, today: string) => d.day === today && d.stars > 0

/** Streak as shown today: it survives until you miss a whole day. */
export const streakNow = (d: DailyRecord, today: string) => (d.lastWin && gap(d.lastWin, today) <= 1 ? d.streak : 0)

/** Record a win. `first` is true the first time today, which is when the coins are paid. */
export function recordWin(d: DailyRecord, today: string, stars: number, movesLeft: number): { next: DailyRecord; first: boolean } {
  const first = !wonToday(d, today)
  const streak = first ? (d.lastWin && gap(d.lastWin, today) === 1 ? d.streak + 1 : 1) : d.streak
  const better = first || stars > d.stars || (stars === d.stars && movesLeft > d.movesLeft)
  return { first, next: { day: today, stars: better ? stars : d.stars, movesLeft: better ? movesLeft : d.movesLeft, streak, lastWin: today } }
}

/** The text players paste into a message. */
export function shareText(day: string, stars: number, movesLeft: number, streak: number): string {
  const s = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))
  return `\u{1F363} Bentopia Daily #${dailyNumber(day)}\n${s} · ${movesLeft} moves to spare${streak > 1 ? ` · \u{1F525} ${streak} day streak` : ''}\nCan you beat it? https://bentopia.cdblogic.com`
}
