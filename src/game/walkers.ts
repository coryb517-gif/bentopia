import { useEffect, useRef, useState } from 'react'
import { doorSpan, footprint, itemDef, seats, type Restaurant } from './restaurant'

/** A tile coordinate [x, y]. */
export type Pt = [number, number]

const key = (p: Pt) => `${p[0]},${p[1]}`
const DIRS: Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** Tiles that furniture stands on. Rugs and wall decor do not block walking. */
export function blockedTiles(r: Restaurant): Set<string> {
  const out = new Set<string>()
  for (const p of r.items) {
    if (itemDef(p.type).layer !== 'floor') continue
    for (const c of footprint(p.type, p.gx, p.gy, p.flip)) out.add(key(c))
  }
  return out
}

const open = (blocked: Set<string>, grid: number, [x, y]: Pt) => x >= 0 && y >= 0 && x < grid && y < grid && !blocked.has(`${x},${y}`)

/** Shortest walkable route between two tiles (4-way), excluding the start. Null if there is none. */
export function findPath(blocked: Set<string>, grid: number, from: Pt, to: Pt): Pt[] | null {
  if (key(from) === key(to)) return []
  if (!open(blocked, grid, to)) return null
  const prev = new Map<string, Pt>()
  const seen = new Set([key(from)])
  const queue: Pt[] = [from]
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]
    for (const [dx, dy] of DIRS) {
      const nxt: Pt = [cur[0] + dx, cur[1] + dy]
      const k = key(nxt)
      if (seen.has(k) || !open(blocked, grid, nxt)) continue
      seen.add(k)
      prev.set(k, cur)
      if (k === key(to)) {
        const path: Pt[] = [nxt]
        for (let at = cur; key(at) !== key(from); at = prev.get(key(at))!) path.unshift(at)
        return path
      }
      queue.push(nxt)
    }
  }
  return null
}

/** Every tile reachable from `from`, with its walking distance. */
export function reachable(blocked: Set<string>, grid: number, from: Pt): Map<string, number> {
  const dist = new Map<string, number>([[key(from), 0]])
  const queue: Pt[] = [from]
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]
    for (const [dx, dy] of DIRS) {
      const nxt: Pt = [cur[0] + dx, cur[1] + dy]
      if (dist.has(key(nxt)) || !open(blocked, grid, nxt)) continue
      dist.set(key(nxt), dist.get(key(cur))! + 1)
      queue.push(nxt)
    }
  }
  return dist
}

/** The free tile just inside the street door, or the nearest free tile to it. */
export function entranceTile(blocked: Set<string>, grid: number): Pt | null {
  const { u, w } = doorSpan(grid)
  const x = Math.min(grid - 1, Math.max(0, Math.floor((u + w / 2) / 32)))
  const start: Pt = [x, 0]
  if (open(blocked, grid, start)) return start
  let best: Pt | null = null
  let bestD = Infinity
  for (let gx = 0; gx < grid; gx++) {
    for (let gy = 0; gy < grid; gy++) {
      if (!open(blocked, grid, [gx, gy])) continue
      const d = Math.abs(gx - x) + gy
      if (d < bestD) {
        bestD = d
        best = [gx, gy]
      }
    }
  }
  return best
}

/** Free tiles next to a piece of furniture where someone can stand to serve it. */
export function standingSpots(blocked: Set<string>, grid: number, cells: Pt[]): Pt[] {
  const mine = new Set(cells.map(key))
  const out = new Map<string, Pt>()
  for (const c of cells) {
    for (const [dx, dy] of DIRS) {
      const p: Pt = [c[0] + dx, c[1] + dy]
      if (!mine.has(key(p)) && open(blocked, grid, p)) out.set(key(p), p)
    }
  }
  return [...out.values()]
}

export interface Walker {
  id: 'waiter' | 'cat'
  x: number
  y: number
  /** Facing left (true) or right (false) on screen. */
  left: boolean
  mode: 'walk' | 'serve' | 'rest'
  carrying: boolean
}

interface Sim {
  pos: Pt
  path: Pt[]
  wait: number
  mode: Walker['mode']
  carrying: boolean
  left: boolean
  /** The waiter's current job, in order. */
  job: 'idle' | 'fetch' | 'deliver' | 'serve' | 'return'
  target: Pt | null
}

const fresh = (pos: Pt, wait: number): Sim => ({ pos, path: [], wait, mode: 'rest', carrying: false, left: false, job: 'idle', target: null })
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]

/**
 * A waiter who carries dishes from the door to diners, and a cat who wanders and naps. They find their
 * way around whatever furniture the player has placed, and step once every `STEP_MS`.
 */
export const STEP_MS = 520

export function useWalkers(r: Restaurant, grid: number, live: boolean): Walker[] {
  const rRef = useRef(r)
  rRef.current = r
  const sims = useRef<{ waiter: Sim | null; cat: Sim | null }>({ waiter: null, cat: null })
  const [list, setList] = useState<Walker[]>([])

  useEffect(() => {
    if (!live) {
      setList([])
      return
    }
    sims.current = { waiter: null, cat: null }
    const snapshot = (): Walker[] => {
      const out: Walker[] = []
      for (const id of ['waiter', 'cat'] as const) {
        const s = sims.current[id]
        if (s) out.push({ id, x: s.pos[0], y: s.pos[1], left: s.left, mode: s.mode, carrying: s.carrying })
      }
      return out
    }

    const step = (id: 'waiter' | 'cat', s: Sim, blocked: Set<string>, door: Pt | null) => {
      // If the player built over us, start again somewhere free.
      if (!open(blocked, grid, s.pos)) {
        const home = id === 'waiter' ? door : door ? ([door[0], Math.min(grid - 1, door[1] + 1)] as Pt) : null
        if (!home) return
        s.pos = home
        s.path = []
        s.job = 'idle'
        s.wait = 2
      }
      if (s.wait > 0) {
        s.wait--
        if (s.wait === 0 && s.job === 'serve') {
          s.carrying = false
          s.job = 'return'
          s.path = door ? (findPath(blocked, grid, s.pos, door) ?? []) : []
          s.mode = 'walk'
        }
        return
      }
      if (s.path.length) {
        const next = s.path.shift()!
        if (!open(blocked, grid, next)) {
          s.path = []
          return
        }
        if (next[0] !== s.pos[0] || next[1] !== s.pos[1]) s.left = next[0] < s.pos[0] || next[1] > s.pos[1]
        s.pos = next
        s.mode = 'walk'
        return
      }
      // Arrived somewhere: decide what comes next.
      if (id === 'waiter') {
        if (s.job === 'fetch') {
          s.job = 'deliver'
          s.carrying = true
          const diners = seats(rRef.current)
          const seat = diners.length ? pick(diners) : null
          const item = seat ? rRef.current.items.find((p) => p.id === seat.itemId) : null
          const spots = item ? standingSpots(blocked, grid, footprint(item.type, item.gx, item.gy, item.flip)) : []
          const route = spots.length ? findPath(blocked, grid, s.pos, pick(spots)) : null
          if (route) {
            s.path = route
          } else {
            s.job = 'return'
            s.carrying = false
            s.path = door ? (findPath(blocked, grid, s.pos, door) ?? []) : []
          }
        } else if (s.job === 'deliver') {
          s.job = 'serve'
          s.mode = 'serve'
          s.wait = 3
        } else if (s.job === 'return') {
          s.job = 'idle'
          s.mode = 'rest'
          s.wait = 2 + Math.floor(Math.random() * 4)
        } else {
          s.job = 'fetch'
          s.mode = 'walk'
          s.path = door ? (findPath(blocked, grid, s.pos, door) ?? []) : []
          if (!s.path.length) s.wait = 1
        }
        return
      }
      // The cat: nap for a while, then pad off somewhere new.
      if (s.mode === 'walk') {
        s.mode = 'rest'
        s.wait = 6 + Math.floor(Math.random() * 8)
        return
      }
      const spots = [...reachable(blocked, grid, s.pos).entries()].filter(([, d]) => d >= 2 && d <= 7)
      if (spots.length) {
        const [k] = pick(spots)
        const [px, py] = k.split(',').map(Number)
        s.path = findPath(blocked, grid, s.pos, [px, py]) ?? []
        s.mode = 'walk'
      } else {
        s.wait = 4
      }
    }

    const tick = () => {
      const cur = rRef.current
      const blocked = blockedTiles(cur)
      const door = entranceTile(blocked, grid)
      if (!door) return
      if (!sims.current.waiter) sims.current.waiter = fresh(door, 2)
      if (!sims.current.cat) {
        const free = [...reachable(blocked, grid, door).keys()].map((k) => k.split(',').map(Number) as Pt)
        sims.current.cat = fresh(free.length ? pick(free) : door, 4)
      }
      step('waiter', sims.current.waiter, blocked, door)
      step('cat', sims.current.cat, blocked, door)
      setList(snapshot())
    }

    tick()
    const timer = setInterval(tick, STEP_MS)
    return () => clearInterval(timer)
  }, [live, grid])

  return list
}
