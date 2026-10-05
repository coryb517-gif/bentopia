/** First-time experience: learn by doing, one small step at a time. */
export type Step = 'intro' | 'link' | 'merged' | 'play' | 'win' | 'hub' | 'decorate' | 'placed' | 'back' | 'done'

export interface Tutorial {
  step: Step
  /** The first mixed-recipe level gets a one-time callout. */
  mixedSeen: boolean
}

/** Coins gifted after the first order so the first trip to Decorate can buy something. */
export const TUTORIAL_GIFT = 100

const KEY = 'bentopia.tutorial'
const STEPS: Step[] = ['intro', 'link', 'merged', 'play', 'win', 'hub', 'decorate', 'placed', 'back', 'done']

/** Returning players (anyone with progress) skip it; `?tutorial` replays it. */
export function loadTutorial(hasProgress: boolean): Tutorial {
  try {
    if (new URLSearchParams(location.search).has('tutorial')) return { step: 'intro', mixedSeen: false }
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && STEPS.includes(raw.step)) return { step: raw.step, mixedSeen: !!raw.mixedSeen }
  } catch {
    /* storage unavailable or corrupt */
  }
  return hasProgress ? { step: 'done', mixedSeen: true } : { step: 'intro', mixedSeen: false }
}

export function saveTutorial(t: Tutorial) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t))
  } catch {
    /* storage unavailable */
  }
}

export const inLevelOne = (s: Step) => s === 'intro' || s === 'link' || s === 'merged' || s === 'play' || s === 'win'
