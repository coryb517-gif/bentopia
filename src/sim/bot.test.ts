import { describe, expect, it } from 'vitest'
import { chainOutcome, commitChain, neighbors, newGame } from './engine'
import { LEVELS } from './levels'
import { RECIPES } from './items'
import type { GameState } from './types'

/** Every valid chain of length 3 (mixed trios and same-kind trios). */
function trios(s: GameState): number[][] {
  const out: number[][] = []
  for (let a = 0; a < 64; a++)
    for (const b of neighbors(a))
      for (const c of neighbors(b)) if (c !== a && chainOutcome(s, [a, b, c])) out.push([a, b, c])
  return out
}

/** Which (kind,tier) outputs still help the order, directly or as an ingredient. */
function wanted(s: GameState): Set<string> {
  const w = new Set<string>()
  s.level.order.forEach((o, i) => {
    if (s.progress[i] >= o.count) return
    w.add(`${o.kind}.${o.tier}`)
    const r = RECIPES.find((x) => x.out.kind === o.kind && x.out.tier === o.tier)
    if (r) r.inputs.forEach((inp) => w.add(`${inp.kind}.${inp.tier}`))
    else if (o.tier === 2) w.add(`${o.kind}.1`)
  })
  return w
}

function play(levelIdx: number, seed: number): GameState {
  let s = newGame(LEVELS[levelIdx], seed)
  while (s.status === 'playing') {
    const w = wanted(s)
    const options = trios(s)
    if (!options.length) break
    const score = (p: number[]) => {
      const out = chainOutcome(s, p)!
      // Land crafted items next to their siblings so a later trio is reachable.
      const land = p[p.length - 1]
      const sameNear = neighbors(land).filter((n) => !p.includes(n) && s.cells[n]?.kind === out.kind && s.cells[n]?.tier === out.tier).length
      const wantedNear =
        out.tier === 1 ? neighbors(land).filter((n) => !p.includes(n) && s.cells[n]?.tier === 1 && w.has(`${s.cells[n]!.kind}.1`)).length : 0
      return (w.has(`${out.kind}.${out.tier}`) ? 10 : 0) + out.tier + sameNear * 0.6 + wantedNear * 0.4
    }
    options.sort((x, y) => score(y) - score(x))
    s = commitChain(s, options[0])
  }
  return s
}

/** A deliberately dull bot should still clear every level sometimes, and the early ones usually. */
describe('level solvability (greedy bot)', () => {
  it.each(Array.from({ length: 20 }, (_, i) => [i]))('level index %i is clearable by the greedy bot', (idx) => {
    let wins = 0
    for (let seed = 1; seed <= 10; seed++) if (play(idx, seed).status === 'won') wins++
    const easy = idx < 4 || (idx >= 10 && idx < 13)
    expect(wins).toBeGreaterThanOrEqual(easy ? 7 : 2)
  })
})
