/**
 * The player's restaurant: a grid of tiles with furniture on it. Pure data and rules, no rendering.
 * Persisted as JSON (the spec's `restaurants.layout`), so it can move to the server unchanged.
 */
export type ItemType =
  | 'table' | 'stool' | 'lamp' | 'bonsai' | 'neko' | 'counter' | 'tank'
  | 'sign' | 'sakura' | 'vending' | 'taiko' | 'statue' | 'pond' | 'torii'

export interface ItemDef {
  type: ItemType
  name: string
  blurb: string
  /** Footprint in tiles. */
  w: number
  d: number
  price: number
  /** Contribution to decor score. */
  value: number
  /** Restaurant level needed to buy it. */
  unlock: number
  /** Customers who can sit here. */
  seats: number
}

export const ITEMS: ItemDef[] = [
  { type: 'table', name: 'Low table', blurb: 'Tea, cushions, and a place to eat.', w: 1, d: 1, price: 60, value: 18, unlock: 1, seats: 2 },
  { type: 'stool', name: 'Bar stool', blurb: 'A perch for solo diners.', w: 1, d: 1, price: 30, value: 9, unlock: 1, seats: 1 },
  { type: 'lamp', name: 'Paper lantern', blurb: 'A warm pool of light.', w: 1, d: 1, price: 45, value: 15, unlock: 1, seats: 0 },
  { type: 'bonsai', name: 'Bonsai', blurb: 'Patient, tiny, and very smug.', w: 1, d: 1, price: 70, value: 22, unlock: 1, seats: 0 },
  { type: 'neko', name: 'Lucky cat', blurb: 'Waves in customers all day.', w: 1, d: 1, price: 120, value: 40, unlock: 2, seats: 0 },
  { type: 'counter', name: 'Sushi counter', blurb: 'Two seats, front row to the chef.', w: 2, d: 1, price: 140, value: 46, unlock: 2, seats: 2 },
  { type: 'tank', name: 'Fish tank', blurb: 'Watch dinner swim by. Awkward.', w: 1, d: 1, price: 180, value: 60, unlock: 2, seats: 0 },
  { type: 'sign', name: 'Neon sign', blurb: 'OPEN. Buzzes just right.', w: 1, d: 1, price: 150, value: 50, unlock: 3, seats: 0 },
  { type: 'sakura', name: 'Sakura tree', blurb: 'Petals drift down all night.', w: 1, d: 1, price: 260, value: 88, unlock: 3, seats: 0 },
  { type: 'vending', name: 'Vending machine', blurb: 'Hot cans. Glowing. Essential.', w: 1, d: 1, price: 240, value: 80, unlock: 3, seats: 0 },
  { type: 'taiko', name: 'Taiko drum', blurb: 'Boom. Customers love it.', w: 1, d: 1, price: 300, value: 100, unlock: 4, seats: 0 },
  { type: 'statue', name: 'Bento-kun statue', blurb: 'Gold-trimmed and very proud.', w: 1, d: 1, price: 320, value: 108, unlock: 4, seats: 0 },
  { type: 'pond', name: 'Koi pond', blurb: 'Two koi and one lily pad.', w: 2, d: 1, price: 420, value: 140, unlock: 5, seats: 0 },
  { type: 'torii', name: 'Torii gate', blurb: 'The grandest entrance in the market.', w: 2, d: 1, price: 500, value: 170, unlock: 5, seats: 0 },
]

export const itemDef = (t: ItemType) => ITEMS.find((i) => i.type === t)!

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

export interface Placed {
  id: number
  type: ItemType
  gx: number
  gy: number
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
const LEVEL_AT = [0, 120, 320, 650, 1100]
const GRID_AT = [5, 5, 6, 6, 7]

export function decorScore(r: Restaurant): number {
  const items = r.items.reduce((sum, p) => sum + itemDef(p.type).value, 0)
  return items + (r.floor !== 'wood' ? 12 : 0) + (r.wall !== 'cream' ? 12 : 0)
}

/** 1 to 5. */
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
export function footprint(type: ItemType, gx: number, gy: number): [number, number][] {
  const { w, d } = itemDef(type)
  const cells: [number, number][] = []
  for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) cells.push([gx + x, gy + y])
  return cells
}

export function canPlace(r: Restaurant, type: ItemType, gx: number, gy: number, grid: number, ignoreId?: number): boolean {
  const mine = footprint(type, gx, gy)
  if (mine.some(([x, y]) => x < 0 || y < 0 || x >= grid || y >= grid)) return false
  const taken = new Set<string>()
  for (const p of r.items) {
    if (p.id === ignoreId) continue
    for (const [x, y] of footprint(p.type, p.gx, p.gy)) taken.add(`${x},${y}`)
  }
  return mine.every(([x, y]) => !taken.has(`${x},${y}`))
}

export function placeItem(r: Restaurant, type: ItemType, gx: number, gy: number): Restaurant {
  return { ...r, items: [...r.items, { id: r.nextId, type, gx, gy }], nextId: r.nextId + 1 }
}

export const moveItem = (r: Restaurant, id: number, gx: number, gy: number): Restaurant => ({
  ...r,
  items: r.items.map((p) => (p.id === id ? { ...p, gx, gy } : p)),
})

export const removeItem = (r: Restaurant, id: number): Restaurant => ({ ...r, items: r.items.filter((p) => p.id !== id) })

/** Selling returns half the price. */
export const sellValue = (type: ItemType) => Math.floor(itemDef(type).price / 2)

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
