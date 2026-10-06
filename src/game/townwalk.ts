/** Walking around the Night Market streets. Pure maths in tile units, no rendering. */
export type V = [number, number]

export interface TownGeometry {
  /** Lot rectangles the avatar cannot enter: [x, y, size]. */
  lots: [number, number, number][]
  /** Edge of the walkable plaza. */
  size: number
  /** Bridge across the river: x range and how far south it reaches. */
  bridge: { x0: number; x1: number; yEnd: number }
}

export const CELL = 0.4
const PAD = 0.12

export function walkable(g: TownGeometry, [x, y]: V): boolean {
  const onBridge = x >= g.bridge.x0 && x <= g.bridge.x1 && y >= 0.2 && y <= g.bridge.yEnd
  if (!onBridge && (x < 0.2 || y < 0.2 || x > g.size - 0.2 || y > g.size - 0.2)) return false
  return !g.lots.some(([lx, ly, ls]) => x > lx - PAD && x < lx + ls + PAD && y > ly - PAD && y < ly + ls + PAD)
}

const cellOf = (v: V): [number, number] => [Math.floor(v[0] / CELL), Math.floor(v[1] / CELL)]
const centre = (c: [number, number]): V => [(c[0] + 0.5) * CELL, (c[1] + 0.5) * CELL]

/** The closest walkable spot to a point (a tap on a building lands on the pavement in front of it). */
export function nearestWalkable(g: TownGeometry, p: V): V {
  if (walkable(g, p)) return p
  let best: V = p
  let bestD = Infinity
  const span = Math.ceil((g.bridge.yEnd + 1) / CELL)
  for (let i = 0; i < span; i++) {
    for (let j = 0; j < span; j++) {
      const c = centre([i, j])
      if (!walkable(g, c)) continue
      const d = Math.hypot(c[0] - p[0], c[1] - p[1])
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
  }
  return best
}

const clear = (g: TownGeometry, a: V, b: V) => {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL / 2))
  for (let i = 1; i < n; i++) if (!walkable(g, [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n])) return false
  return true
}

/** A route on the pavement from one point to another, or null if there is none. Eight-way, then straightened. */
export function findRoute(g: TownGeometry, from: V, to: V): V[] | null {
  const start = cellOf(nearestWalkable(g, from))
  const goal = cellOf(nearestWalkable(g, to))
  const key = (c: [number, number]) => `${c[0]},${c[1]}`
  const open = (c: [number, number]) => walkable(g, centre(c))
  if (!open(start) || !open(goal)) return null
  const prev = new Map<string, [number, number]>()
  const seen = new Set([key(start)])
  const queue: [number, number][] = [start]
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  let found = key(start) === key(goal)
  for (let head = 0; head < queue.length && !found; head++) {
    const cur = queue[head]
    for (const [dx, dy] of dirs) {
      const nxt: [number, number] = [cur[0] + dx, cur[1] + dy]
      if (seen.has(key(nxt)) || !open(nxt)) continue
      // No cutting corners through a building.
      if (dx !== 0 && dy !== 0 && (!open([cur[0] + dx, cur[1]]) || !open([cur[0], cur[1] + dy]))) continue
      seen.add(key(nxt))
      prev.set(key(nxt), cur)
      if (key(nxt) === key(goal)) {
        found = true
        break
      }
      queue.push(nxt)
    }
  }
  if (!found) return null
  const cells: [number, number][] = [goal]
  while (key(cells[0]) !== key(start)) cells.unshift(prev.get(key(cells[0]))!)
  const pts = cells.map(centre)
  pts[pts.length - 1] = nearestWalkable(g, to)
  // String-pull: skip waypoints we can walk straight past.
  const out: V[] = [pts[0]]
  let at = 0
  while (at < pts.length - 1) {
    let far = pts.length - 1
    while (far > at + 1 && !clear(g, pts[at], pts[far])) far--
    out.push(pts[far])
    at = far
  }
  return out
}

export const routeLength = (r: V[]) => r.slice(1).reduce((n, p, i) => n + Math.hypot(p[0] - r[i][0], p[1] - r[i][1]), 0)

/** Where you are after walking `dist` tiles along a route, and which way you face. */
export function along(route: V[], dist: number): { pos: V; done: boolean; dx: number; dy: number } {
  let left = dist
  for (let i = 1; i < route.length; i++) {
    const seg = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1])
    if (left <= seg || i === route.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, left / seg)
      return {
        pos: [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t],
        done: left >= seg && i === route.length - 1,
        dx: route[i][0] - route[i - 1][0],
        dy: route[i][1] - route[i - 1][1],
      }
    }
    left -= seg
  }
  return { pos: route[0] ?? [0, 0], done: true, dx: 0, dy: 0 }
}
