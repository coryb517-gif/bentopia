import { describe, expect, it } from 'vitest'
import { chainOutcome, commitChain, neighbors, newGame } from './engine'
import { dailyLevel, dailyNumber, dailySeed } from './daily'
import { RECIPES } from './items'
import type { GameState } from './types'

function trios(s: GameState): number[][] {
  const out: number[][] = []
  for (let a = 0; a < 64; a++) for (const b of neighbors(a)) for (const c of neighbors(b)) if (c !== a && chainOutcome(s, [a, b, c])) out.push([a, b, c])
  return out
}
function wanted(s: GameState): Set<string> {
  const w = new Set<string>()
  s.level.order.forEach((o, i) => {
    if (s.progress[i] >= o.count) return
    w.add(`${o.kind}.${o.tier}`)
    const r = RECIPES.find((x) => x.out.kind === o.kind && x.out.tier === o.tier)
    if (r) r.inputs.forEach((inp) => w.add(`${inp.kind}.${inp.tier}`))
  })
  return w
}
function play(key: string): GameState {
  let s = newGame(dailyLevel(key), dailySeed(key))
  while (s.status === 'playing') {
    const w = wanted(s)
    const options = trios(s)
    if (!options.length) break
    const score = (p: number[]) => {
      const out = chainOutcome(s, p)!
      const land = p[p.length - 1]
      const sameNear = neighbors(land).filter((n) => !p.includes(n) && s.cells[n]?.kind === out.kind && s.cells[n]?.tier === out.tier).length
      return (w.has(`${out.kind}.${out.tier}`) ? 10 : 0) + out.tier + sameNear * 0.6
    }
    options.sort((x, y) => score(y) - score(x))
    s = commitChain(s, options[0])
  }
  return s
}

describe('daily challenge', () => {
  it('is the same for everyone on a given day and different across days', () => {
    expect(dailyLevel('2026-10-16')).toEqual(dailyLevel('2026-10-16'))
    expect(dailySeed('2026-10-16')).toBe(dailySeed('2026-10-16'))
    const names = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(dailyLevel(`2026-11-${String(i + 1).padStart(2, '0')}`))))
    expect(names.size).toBeGreaterThan(10)
  })
  it('numbers days from 1', () => {
    expect(dailyNumber('2026-10-01')).toBe(1)
    expect(dailyNumber('2026-10-16')).toBe(16)
  })
  it('is winnable by the greedy bot on most days', () => {
    let wins = 0
    const days = 40
    for (let i = 0; i < days; i++) if (play(`2026-12-${String((i % 28) + 1).padStart(2, '0')}`).status === 'won') wins++
    expect(wins / days).toBeGreaterThanOrEqual(0.65)
  }, 120_000)
})
