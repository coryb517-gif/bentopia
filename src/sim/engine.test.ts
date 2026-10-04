import { describe, expect, it } from 'vitest'
import { commitChain, hasLink, isValidChain, newGame } from './engine'
import { LEVELS } from './levels'

/** Greedy bot: commit the first connected run of 3 it finds. */
function findChain(s: ReturnType<typeof newGame>): number[] | null {
  for (let i = 0; i < 64; i++) {
    const t = s.cells[i]
    if (!t || t.tier >= 2 || t.kind !== 0) continue
    const path = [i]
    let cur = i
    for (;;) {
      const next: number | undefined = [-9, -8, -7, -1, 1, 7, 8, 9]
        .map((d) => cur + d)
        .find(
          (n) =>
            n >= 0 &&
            n < 64 &&
            !path.includes(n) &&
            Math.abs((n % 8) - (cur % 8)) <= 1 &&
            s.cells[n]?.kind === t.kind &&
            s.cells[n]?.tier === t.tier,
        )
      if (next === undefined) break
      path.push(next)
      cur = next
      if (path.length === 3) return path
    }
  }
  return null
}

describe('engine', () => {
  it('is deterministic for a seed', () => {
    const a = newGame(LEVELS[0], 42)
    const b = newGame(LEVELS[0], 42)
    expect(a.cells.map((c) => c && [c.kind, c.tier])).toEqual(b.cells.map((c) => c && [c.kind, c.tier]))
  })

  it('always starts with a valid link and fills every open cell', () => {
    for (const level of LEVELS) {
      const s = newGame(level, 7)
      expect(hasLink(s)).toBe(true)
      s.cells.forEach((c, i) => expect(c === null).toBe(s.blocked[i]))
    }
  })

  it('merges a chain into the next tier on the last tile and spends one move', () => {
    const s = newGame(LEVELS[0], 1)
    const path = findChain(s)!
    expect(isValidChain(s, path)).toBe(true)
    const kind = s.cells[path[0]]!.kind
    const next = commitChain(s, path)
    expect(next.movesLeft).toBe(s.movesLeft - 1)
    expect(next.last?.toCell).toBe(path[2])
    expect(next.cells.every((c, i) => (c === null) === next.blocked[i])).toBe(true)
    expect(next.cells.some((c) => c && c.kind === kind && c.tier === 1)).toBe(true)
  })

  it('rejects short and non-adjacent chains', () => {
    const s = newGame(LEVELS[0], 1)
    expect(isValidChain(s, [0, 1])).toBe(false)
    expect(commitChain(s, [0, 63, 5])).toBe(s)
  })

  it('level 1 is winnable by a greedy bot within the move budget for most seeds', () => {
    let wins = 0
    for (let seed = 1; seed <= 20; seed++) {
      let s = newGame(LEVELS[0], seed)
      while (s.status === 'playing') {
        const p = findChain(s)
        if (!p) break
        s = commitChain(s, p)
      }
      if (s.status === 'won') wins++
    }
    expect(wins).toBeGreaterThanOrEqual(10)
  })
})

