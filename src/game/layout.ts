import { canPlace, canPlaceWall, fixedSlots, itemDef, type Category, type ItemType, type Placed, type Restaurant, type WallSide } from './restaurant'
import { blockedTiles, entranceTile, reachable, type Pt } from './walkers'

/**
 * Tidy a floor: keep every item you own and put them where a good designer would.
 * - A clear walkway runs from the street door into the room, and no tile is cut off from it.
 * - Kitchen gear gathers along the left wall; seating forms a spaced cluster in the middle with
 *   stools beside tables; lights flank the door; trees and statues take the back corners.
 * - Rugs sit under the seating, with a runner from the door; wall decor is spread evenly.
 * Returns null if the items cannot all be fitted (nothing is changed then).
 */
export function autoArrange(r: Restaurant, grid: number): Restaurant | null {
  const door = entranceTile(new Set(), grid)
  if (!door) return null
  const [dx] = door
  const mid = Math.floor(grid / 2)
  const lane = new Set<string>()
  for (let y = 0; y <= mid; y++) lane.add(`${dx},${y}`)

  const floor = r.items.filter((p) => itemDef(p.type).layer === 'floor')
  const rugs = r.items.filter((p) => itemDef(p.type).layer === 'rug')
  const wall = r.items.filter((p) => itemDef(p.type).layer === 'wall')

  const rank = (p: Placed) => {
    const def = itemDef(p.type)
    const group: Record<Category, number> = { kitchen: 0, seating: 1, decor: 2, garden: 3, lights: 4, wall: 5, rugs: 6 }
    return group[def.category] * 100 - def.w * def.d * 10 - def.price / 1000
  }
  floor.sort((a, b) => rank(a) - rank(b) || a.id - b.id)

  let cur: Restaurant = { ...r, items: [] }
  const out: Placed[] = []
  const center = (grid - 1) / 2

  const cells = (type: ItemType, gx: number, gy: number, flip: boolean): Pt[] => {
    const def = itemDef(type)
    const w = flip ? def.d : def.w
    const d = flip ? def.w : def.d
    const c: Pt[] = []
    for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) c.push([gx + x, gy + y])
    return c
  }
  const mean = (pts: Pt[]): Pt | null => (pts.length ? [pts.reduce((n, p) => n + p[0], 0) / pts.length, pts.reduce((n, p) => n + p[1], 0) / pts.length] : null)
  const centroidOf = (category: Category) => mean(out.filter((p) => itemDef(p.type).category === category).map((p) => cells(p.type, p.gx, p.gy, !!p.flip)[0]))

  const placeFloor = (p: Placed, respectLane: boolean): boolean => {
    const def = itemDef(p.type)
    const blocked = blockedTiles(cur)
    const cat = def.category
    const orth = (c: Pt) => ([[1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]).map(([ox, oy]) => [c[0] + ox, c[1] + oy] as Pt)
    const kitchenAt = centroidOf('kitchen')
    const gardenAt = centroidOf('garden')
    const tall = ['sakura', 'maple', 'bamboo', 'statue', 'torii', 'clock', 'arcade', 'vending', 'taiko', 'jukebox', 'tank'].includes(p.type)
    const flips = def.w === def.d ? [false] : [false, true]
    let best: { x: number; y: number; flip: boolean; cost: number } | null = null
    const base = reachable(blocked, grid, door).size

    for (const flip of flips) {
      for (let gx = 0; gx < grid; gx++) {
        for (let gy = 0; gy < grid; gy++) {
          if (!canPlace(cur, p.type, gx, gy, grid, undefined, flip)) continue
          const cs = cells(p.type, gx, gy, flip)
          if (respectLane && cs.some(([x, y]) => lane.has(`${x},${y}`))) continue
          const mine = new Set(cs.map(([x, y]) => `${x},${y}`))
          const after = new Set([...blocked, ...mine])
          // Nothing may be walled off from the door.
          const free = grid * grid - after.size
          if (respectLane && reachable(after, grid, door).size < free) continue
          const [fx, fy] = mean(cs)!
          const edge = Math.min(fx, fy)
          let cost = 0
          if (cat === 'kitchen') {
            cost = fx * 4 + fy * 0.5 + (kitchenAt ? Math.hypot(fx - kitchenAt[0], fy - kitchenAt[1]) * 1.6 : 0)
          } else if (cat === 'seating') {
            cost = (Math.abs(fx - center) + Math.abs(fy - center)) * 1.1
            const nb = cs.flatMap(orth).filter(([x, y]) => !mine.has(`${x},${y}`))
            const taken = nb.filter(([x, y]) => blocked.has(`${x},${y}`)).length
            const open = nb.filter(([x, y]) => x >= 0 && y >= 0 && x < grid && y < grid && !after.has(`${x},${y}`)).length
            const beside = nb.some(([x, y]) => out.some((o) => ['table', 'kotatsu', 'counter'].includes(o.type) && cells(o.type, o.gx, o.gy, !!o.flip).some((c) => c[0] === x && c[1] === y)))
            if (open === 0) cost += 60
            if (p.type === 'stool') cost += beside ? -4 : 3
            else cost += taken * 2.2
          } else if (cat === 'garden') {
            cost = (tall ? edge * 2.6 : edge * 1.4 + 1) + (gardenAt ? Math.hypot(fx - gardenAt[0], fy - gardenAt[1]) * 0.5 : 0)
          } else if (cat === 'lights') {
            cost = Math.abs(fx - dx) * 1.4 + fy * 1.1 + (Math.abs(fx - dx) < 0.9 ? 6 : 0)
          } else {
            cost = (tall ? edge * 2.2 : edge * 1.5 + 1) + (cs.some(([x, y]) => x === 0 && y === 0) ? -1 : 0)
          }
          cost += gx * 0.001 + gy * 0.0001
          if (!best || cost < best.cost) best = { x: gx, y: gy, flip, cost }
        }
      }
    }
    void base
    if (!best) return false
    const placed: Placed = { id: p.id, type: p.type, gx: best.x, gy: best.y, ...(best.flip ? { flip: true } : {}) }
    out.push(placed)
    cur = { ...cur, items: [...cur.items, placed] }
    return true
  }

  for (const p of floor) {
    if (!placeFloor(p, true) && !placeFloor(p, false)) return null
  }

  // Rugs: a runner along the walkway, the rest under the seating cluster.
  const seatAt = mean(out.filter((p) => itemDef(p.type).category === 'seating').flatMap((p) => cells(p.type, p.gx, p.gy, !!p.flip)))
  const rugsSorted = [...rugs].sort((a, b) => (a.type === 'runner' ? -1 : 0) - (b.type === 'runner' ? -1 : 0) || a.id - b.id)
  for (const p of rugsSorted) {
    const def = itemDef(p.type)
    let best: { x: number; y: number; flip: boolean; cost: number } | null = null
    for (const flip of def.w === def.d ? [false] : [false, true]) {
      for (let gx = 0; gx < grid; gx++) {
        for (let gy = 0; gy < grid; gy++) {
          if (!canPlace(cur, p.type, gx, gy, grid, undefined, flip)) continue
          const [fx, fy] = mean(cells(p.type, gx, gy, flip))!
          const cost = p.type === 'runner' ? Math.abs(fx - dx) * 3 + gy * 0.5 + (flip ? 0 : 8) : Math.hypot(fx - (seatAt?.[0] ?? center), fy - (seatAt?.[1] ?? center)) + gx * 0.001 + gy * 0.0001
          if (!best || cost < best.cost) best = { x: gx, y: gy, flip, cost }
        }
      }
    }
    if (!best) return null
    const placed: Placed = { id: p.id, type: p.type, gx: best.x, gy: best.y, ...(best.flip ? { flip: true } : {}) }
    out.push(placed)
    cur = { ...cur, items: [...cur.items, placed] }
  }

  // Wall decor: alternate walls and keep pieces as far apart as the wall allows.
  const taken: Record<WallSide, number[]> = { L: [...fixedSlots('L', grid)], R: [...fixedSlots('R', grid)] }
  const count: Record<WallSide, number> = { L: 0, R: 0 }
  for (const p of [...wall].sort((a, b) => a.id - b.id)) {
    const sides = (['L', 'R'] as WallSide[]).sort((a, b) => count[a] - count[b])
    let best: { side: WallSide; slot: number; cost: number } | null = null
    for (const side of sides) {
      for (let slot = 0; slot < grid; slot++) {
        if (!canPlaceWall(cur, p.type, side, slot, grid)) continue
        const gap = taken[side].length ? Math.min(...taken[side].map((s) => Math.abs(s - slot))) : 3
        const cost = -Math.min(gap, 3) * 3 + count[side] * 2.5 + Math.abs(slot - center) * 0.05
        if (!best || cost < best.cost) best = { side, slot, cost }
      }
    }
    if (!best) return null
    const placed: Placed = { id: p.id, type: p.type, gx: best.slot, gy: 0, wall: best.side }
    out.push(placed)
    cur = { ...cur, items: [...cur.items, placed] }
    taken[best.side].push(best.slot)
    count[best.side]++
  }

  // Keep the original order so nothing flickers in the save file.
  const order = new Map(r.items.map((p, i) => [p.id, i]))
  out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  return { ...r, items: out }
}
