import { describe, expect, it } from 'vitest'
import { canExtend, chainOutcome, commitChain, grantMoves, hasLink, isValidChain, newGame, suggestChain } from './engine'
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

describe('mixed recipes', () => {
  /** Level 11 (one Chirashi bowl) with a hand-placed row of crafted tiles. */
  function setup(kinds: number[]) {
    const s = newGame(LEVELS[10], 3)
    kinds.forEach((kind, i) => (s.cells[i] = { id: 900 + i, kind, tier: 1 }))
    return s
  }

  it('makes the mixed dish from one of each input, in any order', () => {
    for (const order of [[0, 1, 3], [3, 0, 1], [1, 3, 0]]) {
      const s = setup(order)
      expect(chainOutcome(s, [0, 1, 2])).toEqual({ kind: 6, tier: 2 })
    }
  })

  it('rejects trios that are not a recipe', () => {
    expect(chainOutcome(setup([0, 1, 2]), [0, 1, 2])).toBeNull()
    expect(chainOutcome(setup([0, 0, 1]), [0, 1, 2])).toBeNull()
    expect(isValidChain(setup([0, 1, 3]), [0, 1])).toBe(false)
  })

  it('only lets a drag continue toward a real recipe', () => {
    const s = setup([0, 1, 3])
    expect(canExtend(s, [0], 1)).toBe(true)
    expect(canExtend(s, [0, 1], 2)).toBe(true)
    const wrong = setup([0, 1, 2])
    expect(canExtend(wrong, [0, 1], 2)).toBe(false)
  })

  it('commits the dish on the last tile and completes the order', () => {
    const s = setup([0, 1, 3])
    const next = commitChain(s, [0, 1, 2])
    expect(next.last?.toCell).toBe(2)
    expect(next.progress).toEqual([1])
    expect(next.status).toBe('won')
  })

  it('counts a mixed trio as a legal move when checking for deadlock', () => {
    const s = setup([0, 1, 3])
    expect(hasLink(s)).toBe(true)
  })
})

describe('rescue moves', () => {
  it('gives a lost game more moves and a playable board, and ignores games still in progress', () => {
    const s = newGame(LEVELS[0], 5)
    expect(grantMoves(s, 5)).toBe(s)
    const lost = { ...s, status: 'lost' as const, movesLeft: 0 }
    const back = grantMoves(lost, 5)
    expect(back.status).toBe('playing')
    expect(back.movesLeft).toBe(5)
    expect(hasLink(back)).toBe(true)
  })
})

describe('hints', () => {
  it('suggests a valid chain that makes what the order needs', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = newGame(LEVELS[0], seed)
      const path = suggestChain(s)!
      expect(path).toHaveLength(3)
      // Level 1 asks for Onigiri, so the hint should link rice.
      expect(chainOutcome(s, path)).toEqual({ kind: 0, tier: 1 })
    }
  })

  it('suggests a mixed trio when that is what the order needs', () => {
    const s = newGame(LEVELS[10], 3)
    ;[0, 1, 3].forEach((kind, i) => (s.cells[i] = { id: 900 + i, kind, tier: 1 }))
    expect(chainOutcome(s, suggestChain(s)!)).toEqual({ kind: 6, tier: 2 })
  })

  it('gives nothing once the game is over', () => {
    const s = newGame(LEVELS[0], 1)
    expect(suggestChain({ ...s, status: 'won' })).toBeNull()
  })
})