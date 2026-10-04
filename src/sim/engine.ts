import { MAX_TIER } from './items'
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

function spawn(s: GameState): Tile {
  const { level } = s
  const lowOnMoves = s.movesLeft <= level.moves * 0.4
  const weights: number[] = []
  for (let k = 0; k < level.kinds; k++) {
    let w = 1
    // Mercy spawn: lean toward ingredients the order still needs.
    if (lowOnMoves && level.order.some((o, idx) => o.kind === k && s.progress[idx] < o.count)) w = 2
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
  return { id: s.nextId++, kind, tier: 0 }
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

function canLink(a: Tile | null, b: Tile | null): boolean {
  return !!a && !!b && a.kind === b.kind && a.tier === b.tier && a.tier < MAX_TIER
}

export function hasLink(s: GameState): boolean {
  const seen = new Array<boolean>(CELLS).fill(false)
  for (let i = 0; i < CELLS; i++) {
    const t = s.cells[i]
    if (seen[i] || !t || t.tier >= MAX_TIER) continue
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
  ensureLinkable(s)
  return s
}

/** A chain is valid if it is 3+ distinct tiles, each matching and adjacent to the one before. */
export function isValidChain(s: GameState, path: number[]): boolean {
  if (path.length < 3 || new Set(path).size !== path.length) return false
  for (let i = 0; i < path.length; i++) {
    if (!canLink(s.cells[path[0]], s.cells[path[i]])) return false
    if (i > 0 && !neighbors(path[i - 1]).includes(path[i])) return false
  }
  return true
}

export function canExtend(s: GameState, path: number[], cell: number): boolean {
  if (s.blocked[cell] || path.includes(cell)) return false
  const last = path[path.length - 1]
  return neighbors(last).includes(cell) && canLink(s.cells[path[0]], s.cells[cell])
}

/** Returns the next state, or the same state if the chain is invalid or the game is over. */
export function commitChain(prev: GameState, path: number[]): GameState {
  if (prev.status !== 'playing' || !isValidChain(prev, path)) return prev
  const s: GameState = { ...prev, cells: [...prev.cells], progress: [...prev.progress] }
  const toCell = path[path.length - 1]
  const base = s.cells[toCell]!
  const result: Tile = { id: s.nextId++, kind: base.kind, tier: base.tier + 1 }
  const removed = path.map((i) => s.cells[i]!.id)
  for (const i of path) s.cells[i] = null
  s.cells[toCell] = result
  s.movesLeft--
  s.last = { removed, resultId: result.id, toCell }

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
