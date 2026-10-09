import { BOMB_KIND, WILD_KIND, FIRST_MIXED_KIND, MAX_TIER, RECIPES, type ItemRef } from './items'
import { nextRandom } from './rng'
import type { GameState, LevelDef, Tile } from './types'

export const SIZE = 8
const CELLS = SIZE * SIZE

export function neighbors(i: number): number[] {
  const r = Math.floor(i / SIZE)
  const c = i % SIZE
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out.push(rr * SIZE + cc)
    }
  }
  return out
}

function rand(s: GameState): number {
  const [st, v] = nextRandom(s.rng)
  s.rng = st
  return v
}

/** Does an order line depend on raw ingredient kind `k`, directly or through a mixed recipe? */
function needsKind(o: ItemRef, k: number): boolean {
  if (o.kind < FIRST_MIXED_KIND) return o.kind === k
  const r = RECIPES.find((x) => x.out.kind === o.kind && x.out.tier === o.tier)
  return !!r && r.inputs.some((i) => i.kind === k)
}

function spawn(s: GameState): Tile {
  const { level } = s
  const lowOnMoves = s.movesLeft <= level.moves * 0.4
  const weights: number[] = []
  for (let k = 0; k < level.kinds; k++) {
    let w = 1
    // Mercy spawn: lean toward ingredients the order still needs.
    if (level.order.some((o, idx) => s.progress[idx] < o.count && needsKind(o, k))) w = lowOnMoves ? 3.4 : 2.3
    weights.push(w)
  }
  const total = weights.reduce((a, b) => a + b, 0)
  let pick = rand(s) * total
  let kind = 0
  for (let k = 0; k < weights.length; k++) {
    pick -= weights[k]
    if (pick < 0) {
      kind = k
      break
    }
  }
  const tile: Tile = { id: s.nextId++, kind, tier: 0 }
  // Golden stars only drop on levels that ask for them, so earlier chapters stay as they were.
  if (level.luck && rand(s) < level.luck) tile.lucky = true
  return tile
}

/** Compact each column segment downward, then fill the gaps with new raw tiles. */
function settle(s: GameState) {
  for (let c = 0; c < SIZE; c++) {
    let r = SIZE - 1
    while (r >= 0) {
      if (s.blocked[r * SIZE + c]) {
        r--
        continue
      }
      let top = r
      while (top - 1 >= 0 && !s.blocked[(top - 1) * SIZE + c]) top--
      const tiles: Tile[] = []
      for (let rr = r; rr >= top; rr--) {
        const t = s.cells[rr * SIZE + c]
        if (t) tiles.push(t)
      }
      let n = 0
      for (let rr = r; rr >= top; rr--) {
        s.cells[rr * SIZE + c] = n < tiles.length ? tiles[n++] : spawn(s)
      }
      r = top - 1
    }
  }
}

export const isBomb = (t: Tile | null | undefined): boolean => !!t && t.kind === BOMB_KIND
export const isWild = (t: Tile | null | undefined): boolean => !!t && t.kind === WILD_KIND

function canLink(a: Tile | null, b: Tile | null): boolean {
  return !!a && !!b && !isBomb(a) && !isWild(a) && !isWild(b) && !a.ice && !b.ice && a.kind === b.kind && a.tier === b.tier && a.tier < MAX_TIER
}

export function hasLink(s: GameState): boolean {
  const seen = new Array<boolean>(CELLS).fill(false)
  for (let i = 0; i < CELLS; i++) {
    const t = s.cells[i]
    if (seen[i] || !t || t.tier >= MAX_TIER || t.ice || isWild(t)) continue
    let size = 0
    const stack = [i]
    seen[i] = true
    while (stack.length) {
      const cur = stack.pop()!
      size++
      for (const n of neighbors(cur)) {
        if (!seen[n] && canLink(t, s.cells[n])) {
          seen[n] = true
          stack.push(n)
        }
      }
    }
    if (size >= 3) return true
  }
  // A Chef's Special joins any ingredient, so look at every trio when one is on the board.
  if (s.cells.some(isWild)) {
    for (let a = 0; a < CELLS; a++) {
      if (!s.cells[a]) continue
      for (const b of neighbors(a)) for (const c of neighbors(b)) if (c !== a && chainOutcome(s, [a, b, c])) return true
    }
  }
  // Mixed recipes: any adjacent trio that matches one.
  for (let a = 0; a < CELLS; a++) {
    if (!s.cells[a] || s.cells[a]!.tier !== 1) continue
    for (const b of neighbors(a)) {
      for (const c of neighbors(b)) {
        if (c !== a && chainOutcome(s, [a, b, c])) return true
      }
    }
  }
  return false
}

/** Reshuffle in place until a link exists. Free: costs no move. */
function ensureLinkable(s: GameState) {
  for (let attempt = 0; attempt < 60 && !hasLink(s); attempt++) {
    const idx: number[] = []
    for (let i = 0; i < CELLS; i++) if (s.cells[i]) idx.push(i)
    const tiles = idx.map((i) => s.cells[i])
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(rand(s) * (i + 1))
      ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }
    idx.forEach((cell, n) => (s.cells[cell] = tiles[n]))
    // Late attempts: swap raw tiles for fresh ones in case the mix itself is stuck.
    if (attempt >= 30) {
      for (const cell of idx) {
        if (s.cells[cell]!.tier === 0) s.cells[cell] = spawn(s)
      }
    }
  }
}

/** Put the level's starting ice on random raw tiles. Later levels get a second layer on some. */
function freezeSome(s: GameState) {
  const n = s.level.ice ?? 0
  if (!n) return
  const raw: number[] = []
  for (let i = 0; i < CELLS; i++) {
    const t = s.cells[i]
    if (t && t.tier === 0 && !isBomb(t) && !isWild(t)) raw.push(i)
  }
  for (let k = 0; k < n && raw.length; k++) {
    const pick = raw.splice(Math.floor(rand(s) * raw.length), 1)[0]
    const t = s.cells[pick]!
    s.cells[pick] = { ...t, ice: s.level.id >= 40 && k % 2 === 0 ? 2 : 1 }
  }
}

export function newGame(level: LevelDef, seed: number): GameState {
  const blocked = Array.from({ length: CELLS }, (_, i) => level.shape[Math.floor(i / SIZE)][i % SIZE] === '#')
  const s: GameState = {
    level,
    cells: new Array<Tile | null>(CELLS).fill(null),
    blocked,
    movesLeft: level.moves,
    progress: level.order.map(() => 0),
    rng: seed >>> 0,
    nextId: 1,
    status: 'playing',
    stars: 0,
    last: null,
  }
  settle(s)
  freezeSome(s)
  ensureLinkable(s)
  return s
}

const sortedKey = (items: ItemRef[]) =>
  items
    .map((i) => `${i.kind}.${i.tier}`)
    .sort()
    .join('|')

/** The mixed recipe these exact tiles make, if any (order does not matter). */
function recipeMatching(tiles: ItemRef[]): ItemRef | null {
  const key = sortedKey(tiles)
  return RECIPES.find((r) => sortedKey(r.inputs) === key)?.out ?? null
}

/** Could `tiles` still grow into some recipe? Used to decide whether a drag may continue. */
function recipeCouldInclude(tiles: ItemRef[]): boolean {
  return RECIPES.some((r) => {
    const pool = r.inputs.map((i) => `${i.kind}.${i.tier}`)
    return tiles.every((t) => {
      const at = pool.indexOf(`${t.kind}.${t.tier}`)
      if (at < 0) return false
      pool.splice(at, 1)
      return true
    })
  })
}

/**
 * What a chain would produce, or null if it is not a valid chain. A chain is 3+ distinct
 * adjacent tiles that are either all identical (makes the next tier) or exactly one of each
 * input of a mixed recipe.
 */
export function chainOutcome(s: GameState, path: number[]): ItemRef | null {
  if (path.length < 3 || new Set(path).size !== path.length) return null
  for (let i = 1; i < path.length; i++) if (!neighbors(path[i - 1]).includes(path[i])) return null
  const tiles = path.map((i) => s.cells[i])
  if (tiles.some((t) => !t || isBomb(t) || t.ice)) return null
  const real = (tiles as Tile[]).filter((x) => !isWild(x))
  if (real.length < tiles.length) {
    // With a Chef's Special in the chain, the rest must be one raw ingredient.
    if (!real.length) return null
    return real.every((x) => x.kind === real[0].kind && x.tier === 0) ? { kind: real[0].kind, tier: 1 } : null
  }
  const first = tiles[0]!
  if (tiles.every((t) => t!.kind === first.kind && t!.tier === first.tier)) {
    return first.tier < MAX_TIER ? { kind: first.kind, tier: first.tier + 1 } : null
  }
  return recipeMatching(tiles as Tile[])
}

export const isValidChain = (s: GameState, path: number[]) => chainOutcome(s, path) !== null

export function canExtend(s: GameState, path: number[], cell: number): boolean {
  if (s.blocked[cell] || path.includes(cell)) return false
  const last = path[path.length - 1]
  if (!neighbors(last).includes(cell)) return false
  const tiles = [...path, cell].map((i) => s.cells[i])
  if (tiles.some((t) => !t || isBomb(t) || t.ice)) return false
  const real = (tiles as Tile[]).filter((x) => !isWild(x))
  if (real.length < tiles.length) return real.every((x) => x.kind === (real[0]?.kind ?? x.kind) && x.tier === 0)
  const first = tiles[0]!
  if (tiles.every((t) => t!.kind === first.kind && t!.tier === first.tier)) return first.tier < MAX_TIER
  return recipeCouldInclude(tiles as Tile[])
}

/** Outputs (and the ingredients for them) that the order still needs, as "kind.tier" keys. */
function neededKeys(s: GameState): Set<string> {
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

/** A good three-tile chain to show a player: one that advances the order if possible. */
export function suggestChain(s: GameState): number[] | null {
  if (s.status !== 'playing') return null
  const want = neededKeys(s)
  let best: number[] | null = null
  let bestScore = -1
  for (let a = 0; a < CELLS; a++) {
    if (!s.cells[a]) continue
    for (const b of neighbors(a)) {
      for (const c of neighbors(b)) {
        if (c === a) continue
        const out = chainOutcome(s, [a, b, c])
        if (!out) continue
        const score = (want.has(`${out.kind}.${out.tier}`) ? 10 : 0) + out.tier
        if (score > bestScore) {
          bestScore = score
          best = [a, b, c]
        }
      }
    }
  }
  return best
}

/** Continue a lost game with extra moves (the "+5 moves" rescue). Leaves a playable board. */
export function grantMoves(prev: GameState, n: number): GameState {
  if (prev.status !== 'lost') return prev
  const s: GameState = { ...prev, cells: [...prev.cells], status: 'playing', movesLeft: prev.movesLeft + n, last: null }
  ensureLinkable(s)
  return s
}

/**
 * Tap a Flavor Bomb: clears every raw ingredient in its row and column. Free (no move), and crafted
 * items are never destroyed. Returns the same state if the tile is not a bomb or the game is over.
 */
export function tapBomb(prev: GameState, cell: number): GameState {
  if (prev.status !== 'playing' || !isBomb(prev.cells[cell])) return prev
  const s: GameState = { ...prev, cells: [...prev.cells] }
  const row = Math.floor(cell / SIZE)
  const col = cell % SIZE
  const removed: number[] = []
  for (let i = 0; i < CELLS; i++) {
    const t = s.cells[i]
    if (!t) continue
    const inLine = Math.floor(i / SIZE) === row || i % SIZE === col
    if (inLine && (i === cell || (t.tier === 0 && !isBomb(t)))) {
      removed.push(t.id)
      s.cells[i] = null
    }
  }
  s.last = { removed, resultId: -1, toCell: cell }
  settle(s)
  ensureLinkable(s)
  return s
}

/** Returns the next state, or the same state if the chain is invalid or the game is over. */
export function commitChain(prev: GameState, path: number[]): GameState {
  const out = prev.status === 'playing' ? chainOutcome(prev, path) : null
  if (!out) return prev
  const s: GameState = { ...prev, cells: [...prev.cells], progress: [...prev.progress] }
  const toCell = path[path.length - 1]
  const result: Tile = { id: s.nextId++, kind: out.kind, tier: out.tier }
  const removed = path.map((i) => s.cells[i]!.id)
  const firstKind = s.cells[path[0]]!.kind
  const singleKind = path.some((i) => isWild(s.cells[i])) || path.every((i) => s.cells[i]!.kind === firstKind)
  for (const i of path) s.cells[i] = null
  s.cells[toCell] = result
  s.movesLeft--
  s.last = { removed, resultId: result.id, toCell }
  // Each golden star in the chain pays one move back.
  const stars = path.filter((i) => prev.cells[i]?.lucky).length
  if (stars) {
    s.movesLeft += stars
    s.last.lucky = stars
  }
  // Ice next to the cleared tiles cracks: one layer per move.
  const thawed = new Set<number>()
  for (const i of path) {
    for (const n of neighbors(i)) {
      const nt = s.cells[n]
      if (nt?.ice && !thawed.has(nt.id)) {
        thawed.add(nt.id)
        s.cells[n] = { ...nt, ice: nt.ice > 1 ? nt.ice - 1 : undefined }
      }
    }
  }
  if (thawed.size) s.last.thawed = [...thawed]
  // A long chain of one ingredient (5+) leaves a Flavor Bomb on one of the vacated cells.
  if (singleKind && path.length >= 5) {
    const spots = path.slice(0, -1)
    const spot = spots[Math.floor(rand(s) * spots.length)]
    const bomb: Tile = { id: s.nextId++, kind: BOMB_KIND, tier: 0 }
    s.cells[spot] = bomb
    s.last.bombId = bomb.id
  }
  // An extra-long chain (7+) also leaves a Chef's Special, a wild tile, on another vacated cell.
  if (singleKind && path.length >= 7) {
    const free = path.slice(0, -1).filter((i) => s.cells[i] === null)
    if (free.length) {
      const spot = free[Math.floor(rand(s) * free.length)]
      const wild: Tile = { id: s.nextId++, kind: WILD_KIND, tier: 0 }
      s.cells[spot] = wild
      s.last.wildId = wild.id
    }
  }

  s.level.order.forEach((o, idx) => {
    if (o.kind === result.kind && o.tier === result.tier) s.progress[idx]++
  })

  if (s.level.order.every((o, idx) => s.progress[idx] >= o.count)) {
    s.status = 'won'
    const ratio = s.movesLeft / s.level.moves
    s.stars = ratio >= 0.4 ? 3 : ratio >= 0.2 ? 2 : 1
  } else if (s.movesLeft <= 0) {
    s.status = 'lost'
  }

  settle(s)
  if (s.status === 'playing') ensureLinkable(s)
  return s
}
