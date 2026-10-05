/**
 * The player's restaurant: a grid of tiles with furniture, rugs and wall decor. Pure data and rules,
 * no rendering. Persisted as JSON (the spec's `restaurants.layout`), so it can move to the server unchanged.
 */
export type FloorItem =
  | 'table' | 'stool' | 'counter' | 'kotatsu' | 'booth' | 'bench'
  | 'stove' | 'ricecooker' | 'sushicase' | 'sake' | 'conveyor' | 'ramencart'
  | 'neko' | 'tank' | 'vending' | 'taiko' | 'statue' | 'torii' | 'screen' | 'clock' | 'arcade' | 'jukebox' | 'fox' | 'daruma'
  | 'bonsai' | 'sakura' | 'pond' | 'stonelantern' | 'maple' | 'bamboo' | 'fountain' | 'rockgarden'
  | 'lamp' | 'andon' | 'sign'
export type RugItem = 'rugred' | 'rugwave' | 'rugsakura' | 'runner'
export type WallItem = 'scroll' | 'mask' | 'shelf' | 'neonramen' | 'furin' | 'poster' | 'wallclock' | 'kokeshi'
export type ItemType = FloorItem | RugItem | WallItem

export type Layer = 'floor' | 'rug' | 'wall'
export type Category = 'seating' | 'kitchen' | 'decor' | 'garden' | 'lights' | 'wall' | 'rugs'
export type StyleSet = 'izakaya' | 'sushibar' | 'zen' | 'shrine' | 'neon'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface ItemDef {
  type: ItemType
  name: string
  blurb: string
  /** Footprint in tiles (wall items take one slot). */
  w: number
  d: number
  price: number
  /** Contribution to decor score. */
  value: number
  /** Restaurant level needed to buy it. */
  unlock: number
  /** Customers who can sit here. */
  seats: number
  layer: Layer
  category: Category
  set: StyleSet
}

type Row = [ItemType, string, string, number, number, number, number, number, number, Layer, Category, StyleSet]

// type, name, blurb, w, d, price, value, unlock, seats, layer, category, set
const ROWS: Row[] = [
  // seating
  ['table', 'Low table', 'Tea, cushions, and a place to eat.', 1, 1, 60, 18, 1, 2, 'floor', 'seating', 'izakaya'],
  ['stool', 'Bar stool', 'A perch for solo diners.', 1, 1, 30, 9, 1, 1, 'floor', 'seating', 'izakaya'],
  ['bench', 'Wooden bench', 'Room for two, no elbows.', 2, 1, 70, 22, 2, 2, 'floor', 'seating', 'izakaya'],
  ['kotatsu', 'Kotatsu', 'A heated table. Nobody leaves.', 1, 1, 90, 30, 2, 2, 'floor', 'seating', 'izakaya'],
  ['counter', 'Sushi counter', 'Two seats, front row to the chef.', 2, 1, 140, 46, 2, 2, 'floor', 'seating', 'izakaya'],
  ['booth', 'Corner booth', 'Plush red seats for the whole crew.', 2, 1, 160, 52, 3, 3, 'floor', 'seating', 'izakaya'],
  // kitchen
  ['sake', 'Sake barrels', 'Stacked, roped and ready.', 1, 1, 85, 28, 2, 0, 'floor', 'kitchen', 'izakaya'],
  ['ricecooker', 'Rice cooker', 'Puffs happily all night.', 1, 1, 110, 36, 2, 0, 'floor', 'kitchen', 'sushibar'],
  ['stove', 'Wok stove', 'Real flames. Real drama.', 1, 1, 130, 42, 2, 0, 'floor', 'kitchen', 'sushibar'],
  ['ramencart', 'Ramen cart', 'A yatai on wheels with a glowing lantern.', 1, 1, 190, 62, 3, 0, 'floor', 'kitchen', 'sushibar'],
  ['sushicase', 'Sushi case', 'Glass, chrome and a rainbow of fish.', 2, 1, 220, 72, 3, 0, 'floor', 'kitchen', 'sushibar'],
  ['conveyor', 'Conveyor belt', 'Plates circle by. Grab one!', 2, 1, 350, 116, 4, 0, 'floor', 'kitchen', 'sushibar'],
  // decor
  ['daruma', 'Daruma doll', 'Fill in one eye. Make a wish.', 1, 1, 95, 32, 2, 0, 'floor', 'decor', 'shrine'],
  ['neko', 'Lucky cat', 'Waves in customers all day.', 1, 1, 120, 40, 2, 0, 'floor', 'decor', 'sushibar'],
  ['screen', 'Folding screen', 'Painted cranes over misty hills.', 2, 1, 150, 50, 3, 0, 'floor', 'decor', 'zen'],
  ['fox', 'Fox statue', 'Inari guards the till.', 1, 1, 200, 66, 3, 0, 'floor', 'decor', 'shrine'],
  ['tank', 'Fish tank', 'Watch dinner swim by. Awkward.', 1, 1, 180, 60, 2, 0, 'floor', 'decor', 'sushibar'],
  ['clock', 'Grand clock', 'Tick, tock, order up.', 1, 1, 170, 56, 3, 0, 'floor', 'decor', 'izakaya'],
  ['vending', 'Vending machine', 'Hot cans. Glowing. Essential.', 1, 1, 240, 80, 3, 0, 'floor', 'decor', 'neon'],
  ['arcade', 'Arcade cabinet', 'High score: Bento-kun.', 1, 1, 280, 94, 4, 0, 'floor', 'decor', 'neon'],
  ['taiko', 'Taiko drum', 'Boom. Customers love it.', 1, 1, 300, 100, 4, 0, 'floor', 'decor', 'shrine'],
  ['jukebox', 'Jukebox', 'Neon curves and warm notes.', 1, 1, 330, 110, 4, 0, 'floor', 'decor', 'neon'],
  ['statue', 'Bento-kun statue', 'Gold-trimmed and very proud.', 1, 1, 320, 108, 4, 0, 'floor', 'decor', 'shrine'],
  ['torii', 'Torii gate', 'The grandest entrance in the market.', 2, 1, 500, 170, 5, 0, 'floor', 'decor', 'shrine'],
  // garden
  ['bamboo', 'Bamboo grove', 'Rustles when you walk by.', 1, 1, 80, 26, 2, 0, 'floor', 'garden', 'zen'],
  ['bonsai', 'Bonsai', 'Patient, tiny, and very smug.', 1, 1, 70, 22, 1, 0, 'floor', 'garden', 'zen'],
  ['stonelantern', 'Stone lantern', 'A mossy glow in the garden.', 1, 1, 120, 40, 2, 0, 'floor', 'garden', 'zen'],
  ['fountain', 'Bamboo fountain', 'Tok. Tok. Tok. Peaceful.', 1, 1, 240, 80, 3, 0, 'floor', 'garden', 'zen'],
  ['sakura', 'Sakura tree', 'Petals drift down all night.', 1, 1, 260, 88, 3, 0, 'floor', 'garden', 'zen'],
  ['maple', 'Red maple', 'Autumn, all year round.', 1, 1, 300, 100, 4, 0, 'floor', 'garden', 'zen'],
  ['rockgarden', 'Rock garden', 'Raked sand and three wise stones.', 2, 1, 360, 120, 4, 0, 'floor', 'garden', 'zen'],
  ['pond', 'Koi pond', 'Two koi and one lily pad.', 2, 1, 420, 140, 5, 0, 'floor', 'garden', 'zen'],
  // lights
  ['lamp', 'Paper lantern', 'A warm pool of light.', 1, 1, 45, 15, 1, 0, 'floor', 'lights', 'izakaya'],
  ['andon', 'Andon lamp', 'Soft light through washi paper.', 1, 1, 75, 25, 2, 0, 'floor', 'lights', 'izakaya'],
  ['sign', 'Neon sign', 'OPEN. Buzzes just right.', 1, 1, 150, 50, 3, 0, 'floor', 'lights', 'neon'],
  // rugs
  ['rugred', 'Crimson rug', 'Gold-trimmed, softly worn.', 2, 2, 100, 34, 2, 0, 'rug', 'rugs', 'izakaya'],
  ['runner', 'Entry runner', 'A long welcome from the door.', 3, 1, 120, 40, 3, 0, 'rug', 'rugs', 'shrine'],
  ['rugwave', 'Wave rug', 'Seigaiha waves in deep blue.', 2, 2, 140, 46, 3, 0, 'rug', 'rugs', 'sushibar'],
  ['rugsakura', 'Blossom rug', 'A drift of petals underfoot.', 2, 2, 200, 66, 4, 0, 'rug', 'rugs', 'zen'],
  // wall decor
  ['scroll', 'Hanging scroll', 'Calligraphy: "eat well".', 1, 1, 50, 16, 1, 0, 'wall', 'wall', 'izakaya'],
  ['furin', 'Wind chime', 'Tinkles in the draft.', 1, 1, 60, 20, 1, 0, 'wall', 'wall', 'zen'],
  ['poster', 'Festival poster', 'Fireworks over the harbour.', 1, 1, 70, 24, 1, 0, 'wall', 'wall', 'shrine'],
  ['mask', 'Oni mask', 'Scary. Mostly.', 1, 1, 90, 30, 2, 0, 'wall', 'wall', 'shrine'],
  ['wallclock', 'Neon clock', 'Always the right time to eat.', 1, 1, 100, 34, 2, 0, 'wall', 'wall', 'neon'],
  ['shelf', 'Bottle shelf', 'Sake, shochu and one mystery jar.', 1, 1, 110, 36, 2, 0, 'wall', 'wall', 'izakaya'],
  ['kokeshi', 'Kokeshi dolls', 'A row of tiny judges.', 1, 1, 130, 44, 3, 0, 'wall', 'wall', 'zen'],
  ['neonramen', 'Neon RAMEN', 'Hot pink steam, hotter noodles.', 1, 1, 160, 54, 3, 0, 'wall', 'wall', 'neon'],
]

export const ITEMS: ItemDef[] = ROWS.map(([type, name, blurb, w, d, price, value, unlock, seats, layer, category, set]) => ({
  type, name, blurb, w, d, price, value, unlock, seats, layer, category, set,
}))

export const itemDef = (t: ItemType) => ITEMS.find((i) => i.type === t)!

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'seating', name: 'Seating' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'decor', name: 'Decor' },
  { id: 'garden', name: 'Garden' },
  { id: 'lights', name: 'Lights' },
  { id: 'wall', name: 'Wall' },
  { id: 'rugs', name: 'Rugs' },
]

export const SETS: { id: StyleSet; name: string; blurb: string }[] = [
  { id: 'izakaya', name: 'Izakaya', blurb: 'Cozy pub warmth' },
  { id: 'sushibar', name: 'Sushi bar', blurb: 'Counter, kitchen and catch' },
  { id: 'zen', name: 'Zen garden', blurb: 'Calm, green and quiet' },
  { id: 'shrine', name: 'Shrine', blurb: 'Festival and tradition' },
  { id: 'neon', name: 'Neon city', blurb: 'Glow and arcade hum' },
]

export function rarityOf(price: number): Rarity {
  return price >= 400 ? 'legendary' : price >= 220 ? 'epic' : price >= 100 ? 'rare' : 'common'
}

export type FloorId = 'wood' | 'tatami' | 'stone' | 'checker'
export type WallId = 'cream' | 'indigo' | 'matcha' | 'sakura'

export const FLOORS: { id: FloorId; name: string; price: number }[] = [
  { id: 'wood', name: 'Hinoki wood', price: 0 },
  { id: 'tatami', name: 'Tatami', price: 80 },
  { id: 'stone', name: 'Slate stone', price: 100 },
  { id: 'checker', name: 'Red checker', price: 150 },
]

export const WALLS: { id: WallId; name: string; price: number }[] = [
  { id: 'cream', name: 'Paper cream', price: 0 },
  { id: 'indigo', name: 'Midnight indigo', price: 60 },
  { id: 'matcha', name: 'Matcha green', price: 80 },
  { id: 'sakura', name: 'Sakura pink', price: 100 },
]

export type WallSide = 'L' | 'R'

export interface Placed {
  id: number
  type: ItemType
  /** Floor tile x, or the slot along the wall for wall items. */
  gx: number
  gy: number
  /** Mirrored across the room's diagonal: swaps the footprint's width and depth. */
  flip?: boolean
  /** Which wall a wall item hangs on. */
  wall?: WallSide
}

export interface Restaurant {
  floor: FloorId
  wall: WallId
  ownedFloors: FloorId[]
  ownedWalls: WallId[]
  items: Placed[]
  nextId: number
  /** When tips were last collected (ms). */
  tipsAt: number
  /** Highest level reached. Selling decor never lowers your level or shrinks the room. */
  peak?: number
}

export const newRestaurant = (now: number): Restaurant => ({
  floor: 'wood',
  wall: 'cream',
  ownedFloors: ['wood'],
  ownedWalls: ['cream'],
  items: [
    { id: 1, type: 'table', gx: 2, gy: 2 },
    { id: 2, type: 'stool', gx: 4, gy: 1 },
    { id: 3, type: 'lamp', gx: 0, gy: 0 },
    { id: 4, type: 'bonsai', gx: 4, gy: 4 },
  ],
  nextId: 5,
  tipsAt: now,
})

// ---------- Level and score ----------
const LEVEL_AT = [0, 120, 320, 650, 1100, 1800]
const GRID_AT = [5, 6, 6, 7, 7, 8]
export const MAX_LEVEL = LEVEL_AT.length

/** Collections: owning several items from one set earns a bonus on that set's decor. */
export const SET_TIERS: { count: number; bonus: number }[] = [
  { count: 3, bonus: 0.1 },
  { count: 5, bonus: 0.2 },
  { count: 8, bonus: 0.35 },
]

export function setBonusRate(count: number): number {
  let rate = 0
  for (const t of SET_TIERS) if (count >= t.count) rate = t.bonus
  return rate
}

/** Count and bonus per style set, for the restaurant's current items. */
export function setProgress(r: Restaurant): { set: StyleSet; count: number; rate: number; next: number | null }[] {
  return SETS.map((s) => {
    const count = r.items.filter((p) => itemDef(p.type).set === s.id).length
    const nextTier = SET_TIERS.find((t) => count < t.count)
    return { set: s.id, count, rate: setBonusRate(count), next: nextTier?.count ?? null }
  })
}

export function decorScore(r: Restaurant): number {
  let total = 0
  for (const s of SETS) {
    const mine = r.items.filter((p) => itemDef(p.type).set === s.id)
    const base = mine.reduce((sum, p) => sum + itemDef(p.type).value, 0)
    total += base * (1 + setBonusRate(mine.length))
  }
  return Math.round(total) + (r.floor !== 'wood' ? 12 : 0) + (r.wall !== 'cream' ? 12 : 0)
}

/** 1 to MAX_LEVEL. */
export function restaurantLevel(score: number): number {
  let lvl = 1
  LEVEL_AT.forEach((at, i) => {
    if (score >= at) lvl = i + 1
  })
  return lvl
}

/** The level that counts: the best you have reached. */
export const levelOf = (r: Restaurant) => Math.max(r.peak ?? 1, restaurantLevel(decorScore(r)))

export const withPeak = (r: Restaurant): Restaurant => ({ ...r, peak: levelOf(r) })

export const gridSize = (level: number) => GRID_AT[Math.min(level, GRID_AT.length) - 1]

/** Progress toward the next level as {have, need}, or null at max level. */
export function levelProgress(score: number): { have: number; need: number; level: number } | null {
  const level = restaurantLevel(score)
  if (level >= LEVEL_AT.length) return null
  return { have: score - LEVEL_AT[level - 1], need: LEVEL_AT[level] - LEVEL_AT[level - 1], level }
}

// ---------- Placement ----------
export function footprint(type: ItemType, gx: number, gy: number, flip = false): [number, number][] {
  const def = itemDef(type)
  const w = flip ? def.d : def.w
  const d = flip ? def.w : def.d
  const cells: [number, number][] = []
  for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) cells.push([gx + x, gy + y])
  return cells
}

/** Floor furniture blocks furniture; rugs only conflict with other rugs. */
export function canPlace(r: Restaurant, type: ItemType, gx: number, gy: number, grid: number, ignoreId?: number, flip = false): boolean {
  const layer = itemDef(type).layer
  if (layer === 'wall') return false
  const mine = footprint(type, gx, gy, flip)
  if (mine.some(([x, y]) => x < 0 || y < 0 || x >= grid || y >= grid)) return false
  const taken = new Set<string>()
  for (const p of r.items) {
    if (p.id === ignoreId || itemDef(p.type).layer !== layer) continue
    for (const [x, y] of footprint(p.type, p.gx, p.gy, p.flip)) taken.add(`${x},${y}`)
  }
  return mine.every(([x, y]) => !taken.has(`${x},${y}`))
}

export function placeItem(r: Restaurant, type: ItemType, gx: number, gy: number, flip = false): Restaurant {
  return { ...r, items: [...r.items, { id: r.nextId, type, gx, gy, ...(flip ? { flip: true } : {}) }], nextId: r.nextId + 1 }
}

export const moveItem = (r: Restaurant, id: number, gx: number, gy: number, flip?: boolean): Restaurant => ({
  ...r,
  items: r.items.map((p) => (p.id === id ? { ...p, gx, gy, flip: flip ?? p.flip } : p)),
})

export const removeItem = (r: Restaurant, id: number): Restaurant => ({ ...r, items: r.items.filter((p) => p.id !== id) })

/** Selling returns half the price. */
export const sellValue = (type: ItemType) => Math.floor(itemDef(type).price / 2)

// ---------- Walls ----------
/** The window on the left wall, in px along the wall (32px per tile). Shared with the renderer. */
export function windowSpan(grid: number): { u: number; w: number } {
  const len = grid * 32
  const w = Math.min(132, len - 76)
  return { u: (len - w) / 2 + 6, w }
}

/** The street door on the right wall, in px along the wall. */
export function doorSpan(grid: number): { u: number; w: number } {
  const len = grid * 32
  return { u: len * 0.5 - 26, w: 56 }
}

const slotsCovering = (u: number, w: number, grid: number): Set<number> => {
  const out = new Set<number>()
  for (let s = 0; s < grid; s++) if (s * 32 < u + w && (s + 1) * 32 > u) out.add(s)
  return out
}

/** Wall slots taken by the window (left wall) or door (right wall). */
export function fixedSlots(side: WallSide, grid: number): Set<number> {
  const span = side === 'L' ? windowSpan(grid) : doorSpan(grid)
  return slotsCovering(span.u, span.w, grid)
}

export function canPlaceWall(r: Restaurant, type: ItemType, side: WallSide, slot: number, grid: number, ignoreId?: number): boolean {
  if (itemDef(type).layer !== 'wall') return false
  if (slot < 0 || slot >= grid) return false
  if (fixedSlots(side, grid).has(slot)) return false
  return !r.items.some((p) => p.id !== ignoreId && p.wall === side && p.gx === slot)
}

export const placeWall = (r: Restaurant, type: ItemType, side: WallSide, slot: number): Restaurant => ({
  ...r,
  items: [...r.items, { id: r.nextId, type, gx: slot, gy: 0, wall: side }],
  nextId: r.nextId + 1,
})

export const moveWall = (r: Restaurant, id: number, side: WallSide, slot: number): Restaurant => ({
  ...r,
  items: r.items.map((p) => (p.id === id ? { ...p, gx: slot, wall: side } : p)),
})

// ---------- Customers ----------
/** Seats in a fixed order, so the same diners keep the same places. */
export function seats(r: Restaurant): { itemId: number; gx: number; gy: number; slot: number }[] {
  const out: { itemId: number; gx: number; gy: number; slot: number }[] = []
  for (const p of r.items) {
    const n = itemDef(p.type).seats
    for (let s = 0; s < n; s++) out.push({ itemId: p.id, gx: p.gx, gy: p.gy, slot: s })
  }
  return out
}

// ---------- Tips ----------
const TIP_CAP_HOURS = 6
/** Coins per hour grow with decor, so a nicer restaurant earns more while you are away. */
export const tipsPerHour = (score: number) => 5 + score * 0.15

export function tipsAccrued(r: Restaurant, now: number): number {
  const hours = Math.min(TIP_CAP_HOURS, Math.max(0, now - r.tipsAt) / 3_600_000)
  return Math.floor(hours * tipsPerHour(decorScore(r)))
}

export const collectTips = (r: Restaurant, now: number): Restaurant => ({ ...r, tipsAt: now })

// ---------- Storage ----------
const KEY = 'bentopia.restaurant'

export function loadRestaurant(now: number): Restaurant {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && Array.isArray(raw.items) && typeof raw.nextId === 'number') {
      const known = new Set(ITEMS.map((i) => i.type))
      return { ...newRestaurant(now), ...raw, items: raw.items.filter((p: Placed) => known.has(p.type)) }
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  return newRestaurant(now)
}

export function saveRestaurant(r: Restaurant) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* storage unavailable */
  }
}
