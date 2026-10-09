import { describe, expect, it } from 'vitest'
import { canExtend, chainOutcome, commitChain, hasLink, newGame, tapBomb } from './engine'
import { LEVELS } from './levels'
import { BOMB_KIND } from './items'
import type { GameState } from './types'

/** An empty-ish board of one ingredient we can arrange by hand. */
function board(): GameState {
  const s = newGame(LEVELS[0], 7)
  s.cells = s.cells.map((_, i) => ({ id: 100 + i, kind: 1 + (i % 3), tier: 0 }))
  return s
}

const place = (s: GameState, cell: number, kind: number, ice?: number) => {
  s.cells[cell] = { id: 500 + cell, kind, tier: 0, ...(ice ? { ice } : {}) }
}

describe('frozen tiles', () => {
  it('cannot be linked, extended onto, or start a chain', () => {
    const s = board()
    ;[9, 10, 11].forEach((c) => place(s, c, 0))
    expect(chainOutcome(s, [9, 10, 11])).not.toBeNull()
    place(s, 11, 0, 1)
    expect(chainOutcome(s, [9, 10, 11])).toBeNull()
    expect(canExtend(s, [9, 10], 11)).toBe(false)
    place(s, 9, 0, 1)
    expect(chainOutcome(s, [9, 10, 11])).toBeNull()
  })

  it('thaw one layer when a chain is cleared next to them, and only once per move', () => {
    const s = board()
    ;[9, 10, 11].forEach((c) => place(s, c, 0))
    place(s, 18, 3, 2) // below the chain, two layers
    place(s, 20, 3, 1) // diagonal-adjacent to cell 11
    place(s, 60, 3, 1) // far away
    const after = commitChain(s, [9, 10, 11])
    const find = (id: number) => after.cells.find((t) => t?.id === id)
    expect(find(518)?.ice).toBe(1)
    expect(find(520)?.ice).toBeUndefined()
    expect(find(560)?.ice).toBe(1)
    expect(after.last?.thawed?.sort()).toEqual([518, 520])
  })

  it('shatter when a Flavor Bomb sweeps them away', () => {
    const s = board()
    place(s, 27, BOMB_KIND)
    place(s, 31, 2, 2) // same row
    const after = tapBomb(s, 27)
    expect(after.cells.some((t) => t?.id === 531 && t.ice)).toBe(false)
  })

  it('never leave a board with no moves, and the later levels start with ice', () => {
    for (const id of [25, 36, 40, 48]) {
      const lvl = LEVELS[id - 1]
      expect(lvl.ice).toBeGreaterThan(0)
      const s = newGame(lvl, 3)
      expect(s.cells.filter((t) => t?.ice).length).toBe(lvl.ice)
      expect(hasLink(s)).toBe(true)
    }
    expect(LEVELS.slice(0, 24).every((l) => !l.ice)).toBe(true)
    expect(LEVELS[47].ice!).toBeGreaterThan(LEVELS[24].ice!)
  })
})

import { CHAPTER_INTROS, CHAPTER_RANGES } from './levels'
import { CUSTOMERS } from '../game/Customers'

describe('chapter intros', () => {
  it('each chapter has an intro spoken by a real character', () => {
    expect(CHAPTER_INTROS).toHaveLength(CHAPTER_RANGES.length)
    for (const i of CHAPTER_INTROS) {
      expect(CUSTOMERS.some((c) => c.id === i.speaker)).toBe(true)
      expect(i.line.length).toBeGreaterThan(10)
      expect(i.idea.length).toBeGreaterThan(10)
    }
  })
})

describe('lucky tiles', () => {
  it('pay one move back for each golden star in a chain', () => {
    const s = board()
    ;[9, 10, 11].forEach((c) => place(s, c, 0))
    s.cells[9] = { ...s.cells[9]!, lucky: true }
    s.cells[10] = { ...s.cells[10]!, lucky: true }
    const before = s.movesLeft
    const after = commitChain(s, [9, 10, 11])
    expect(after.movesLeft).toBe(before - 1 + 2)
    expect(after.last?.lucky).toBe(2)
    const plain = board()
    ;[9, 10, 11].forEach((c) => place(plain, c, 0))
    expect(commitChain(plain, [9, 10, 11]).movesLeft).toBe(plain.movesLeft - 1)
  })

  it('only drop from chapter 2 on, and a crafted dish is never lucky', () => {
    expect(LEVELS.slice(0, 12).every((l) => !l.luck)).toBe(true)
    expect(LEVELS.slice(12).every((l) => (l.luck ?? 0) > 0)).toBe(true)
    let stars = 0
    for (let seed = 1; seed <= 20; seed++) stars += newGame(LEVELS[30], seed).cells.filter((t) => t?.lucky).length
    expect(stars).toBeGreaterThan(0)
    const s = board()
    ;[9, 10, 11].forEach((c) => place(s, c, 0))
    const after = commitChain(s, [9, 10, 11])
    expect(after.cells[after.last!.toCell]?.lucky).toBeUndefined()
  })
})
