import { canPlace, canPlaceWall, newRestaurant, placeItem, placeWall, type FloorItem, type FloorId, type Restaurant, type WallId, type WallItem } from './restaurant'

/** A small deterministic random stream, so a neighbour's shop looks the same every visit. */
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

const SEATING: FloorItem[] = ['table', 'table', 'stool', 'stool', 'counter', 'bench', 'kotatsu', 'booth']
const KITCHEN: FloorItem[] = ['sake', 'ricecooker', 'stove', 'sushicase']
const SHOWY: FloorItem[] = ['neko', 'tank', 'bonsai', 'sakura', 'stonelantern', 'lamp', 'andon', 'vending', 'arcade', 'fountain', 'maple', 'fox', 'sign']
const WALL: WallItem[] = ['scroll', 'furin', 'poster', 'mask', 'shelf', 'kokeshi', 'neonramen']
const FLOORS: FloorId[] = ['wood', 'tatami', 'stone', 'checker']
const WALLS: WallId[] = ['cream', 'indigo', 'matcha', 'sakura']

/**
 * A believable restaurant for a neighbouring shop, sized and stocked by its level. Furniture is scattered
 * at random but only where it fits, and the walkway just inside the door is kept clear.
 */
export function neighbourRestaurant(seed: number, level: number): Restaurant {
  const next = rng(seed * 7919 + 13)
  const pick = <T,>(xs: T[]): T => xs[Math.floor(next() * xs.length)]
  const grid = level >= 6 ? 7 : level >= 3 ? 6 : 5
  let r: Restaurant = { ...newRestaurant(0), items: [], nextId: 1, size: grid, floor: pick(FLOORS), wall: pick(WALLS) }
  r = { ...r, ownedFloors: [r.floor], ownedWalls: [r.wall] }
  const want = 5 + level * 2
  const pool: FloorItem[] = [...SEATING, ...SEATING, ...KITCHEN, ...SHOWY]
  const doorX = Math.floor(grid / 2)
  for (let placed = 0, tries = 0; placed < want && tries < 400; tries++) {
    const type = pick(pool)
    const gx = Math.floor(next() * grid)
    const gy = Math.floor(next() * grid)
    const flip = next() < 0.5
    if (gy === 0 && Math.abs(gx - doorX) <= 1) continue
    if (!canPlace(r, type, gx, gy, grid, undefined, flip)) continue
    r = placeItem(r, type, gx, gy, flip)
    placed++
  }
  for (let placed = 0, tries = 0; placed < 2 + Math.floor(level / 2) && tries < 60; tries++) {
    const side = next() < 0.5 ? 'L' : 'R'
    const slot = Math.floor(next() * grid)
    const type = pick(WALL)
    if (!canPlaceWall(r, type, side, slot, grid)) continue
    r = placeWall(r, type, side, slot)
    placed++
  }
  return r
}
