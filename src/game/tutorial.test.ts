import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { inLevelOne, loadTutorial, saveTutorial } from './tutorial'

function fakeBrowser(search = '') {
  const store = new Map<string, string>()
  ;(globalThis as unknown as { location: { search: string } }).location = { search }
  ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  } as Storage
}

describe('tutorial state', () => {
  beforeEach(() => fakeBrowser())
  afterEach(() => {
    delete (globalThis as Partial<{ location: unknown; localStorage: unknown }>).location
    delete (globalThis as Partial<{ location: unknown; localStorage: unknown }>).localStorage
  })

  it('starts brand-new players at the intro', () => {
    expect(loadTutorial(false)).toEqual({ step: 'intro', mixedSeen: false })
  })

  it('skips the tutorial for players who already have progress', () => {
    expect(loadTutorial(true)).toEqual({ step: 'done', mixedSeen: true })
  })

  it('resumes where a player left off', () => {
    saveTutorial({ step: 'decorate', mixedSeen: false })
    expect(loadTutorial(true)).toEqual({ step: 'decorate', mixedSeen: false })
  })

  it('ignores corrupt or unknown saved steps', () => {
    localStorage.setItem('bentopia.tutorial', JSON.stringify({ step: 'nonsense' }))
    expect(loadTutorial(false).step).toBe('intro')
    localStorage.setItem('bentopia.tutorial', '{not json')
    expect(loadTutorial(false).step).toBe('intro')
  })

  it('replays with ?tutorial even for returning players', () => {
    fakeBrowser('?tutorial')
    expect(loadTutorial(true).step).toBe('intro')
  })

  it('knows which steps happen inside level 1', () => {
    expect(['intro', 'link', 'merged', 'play', 'win'].every((s) => inLevelOne(s as never))).toBe(true)
    expect(inLevelOne('hub')).toBe(false)
    expect(inLevelOne('done')).toBe(false)
  })
})
