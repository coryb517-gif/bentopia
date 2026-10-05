import { describe, expect, it } from 'vitest'
import {
  canPlace, collectTips, decorScore, footprint, gridSize, ITEMS, levelOf, levelProgress, moveItem, newRestaurant, placeItem, withPeak, seatTotal, tipCapHours, tipsPerHour,
  removeItem, restaurantLevel, seats, sellValue, tipsAccrued,
} from './restaurant'

const HOUR = 3_600_000

describe('placement', () => {
  const r = newRestaurant(0)

  it('rejects out-of-bounds and overlapping placements', () => {
    expect(canPlace(r, 'bonsai', 0, 1, 5)).toBe(true)
    expect(canPlace(r, 'bonsai', -1, 0, 5)).toBe(false)
    expect(canPlace(r, 'bonsai', 5, 0, 5)).toBe(false)
    expect(canPlace(r, 'bonsai', 2, 2, 5)).toBe(false) // starter table is there
  })

  it('checks the whole footprint of two-tile items', () => {
    expect(footprint('counter', 1, 0)).toEqual([[1, 0], [2, 0]])
    expect(canPlace(r, 'counter', 4, 0, 5)).toBe(false) // second tile off the grid
    expect(canPlace(r, 'counter', 3, 0, 5)).toBe(true)
    expect(canPlace(r, 'counter', 3, 1, 5)).toBe(false) // second tile hits the stool at 4,1
  })

  it('lets an item be moved onto the tile it already occupies', () => {
    expect(canPlace(r, 'table', 2, 2, 5, 1)).toBe(true)
  })

  it('places, moves and removes, and selling pays half', () => {
    const placed = placeItem(r, 'neko', 0, 4)
    expect(placed.items).toHaveLength(r.items.length + 1)
    expect(placed.nextId).toBe(r.nextId + 1)
    const moved = moveItem(placed, placed.nextId - 1, 3, 3)
    expect(moved.items.at(-1)).toMatchObject({ type: 'neko', gx: 3, gy: 3 })
    expect(removeItem(moved, placed.nextId - 1).items).toHaveLength(r.items.length)
    expect(sellValue('neko')).toBe(60)
  })
})

describe('score and level', () => {
  it('scores the starter room and grows with decor and themes', () => {
    const r = newRestaurant(0)
    const base = decorScore(r)
    // table + stool + lantern are an Izakaya trio (+10%), plus the bonsai.
    expect(base).toBe(Math.round((18 + 9 + 15) * 1.1) + 22)
    expect(decorScore({ ...r, floor: 'tatami' })).toBe(base + 12)
    expect(decorScore(placeItem(r, 'torii', 0, 4))).toBe(base + 170)
  })

  it('maps score to levels and room size', () => {
    expect(restaurantLevel(0)).toBe(1)
    expect(restaurantLevel(119)).toBe(1)
    expect(restaurantLevel(120)).toBe(2)
    expect(restaurantLevel(5000)).toBe(6)
    expect(gridSize(1)).toBe(5)
    expect(gridSize(5)).toBe(7)
    expect(gridSize(6)).toBe(8)
    expect(levelProgress(70)).toEqual({ have: 70, need: 120, level: 1 })
    expect(levelProgress(2000)).toBeNull()
  })

  it('every item can be bought at its unlock level and has a sane price', () => {
    for (const i of ITEMS) {
      expect(i.price).toBeGreaterThan(0)
      expect(i.value).toBeGreaterThan(0)
      expect(i.unlock).toBeGreaterThanOrEqual(1)
      expect(i.unlock).toBeLessThanOrEqual(6)
    }
  })
})

describe('customers and tips', () => {
  it('seats diners at tables, stools and counters', () => {
    const r = placeItem(newRestaurant(0), 'counter', 0, 3)
    expect(seats(r)).toHaveLength(2 + 1 + 2) // table, stool, counter
  })

  it('accrues tips by the hour, capped, and resets on collect', () => {
    const r = newRestaurant(0)
    const perHour = tipsPerHour(decorScore(r), seatTotal(r))
    expect(tipsAccrued(r, 0)).toBe(0)
    expect(tipsAccrued(r, HOUR)).toBe(Math.floor(perHour))
    expect(tipsAccrued(r, 100 * HOUR)).toBe(Math.floor(tipCapHours() * perHour))
    expect(tipsAccrued(collectTips(r, 10 * HOUR), 10 * HOUR)).toBe(0)
  })
})

describe('level high-water mark', () => {
  it('keeps your level when you sell decor', () => {
    const rich = withPeak(placeItem(placeItem(placeItem(newRestaurant(0), 'torii', 0, 4), 'pond', 2, 4), 'taiko', 4, 0))
    expect(levelOf(rich)).toBeGreaterThanOrEqual(3)
    const sold = removeItem(removeItem(removeItem(rich, 5), 6), 7)
    expect(restaurantLevel(decorScore(sold))).toBeLessThan(levelOf(rich))
    expect(levelOf(sold)).toBe(levelOf(rich))
  })
})

import type { Restaurant } from './restaurant'
import { canPlaceWall, CATEGORIES, doorSpan, fixedSlots, placeWall, rarityOf, setBonusRate, setProgress, SETS, windowSpan } from './restaurant'

describe('catalogue', () => {
  it('has unique types, valid sets and categories, and every category in the shop', () => {
    const types = ITEMS.map((i) => i.type)
    expect(new Set(types).size).toBe(types.length)
    const setIds = new Set(SETS.map((s) => s.id))
    const catIds = new Set(CATEGORIES.map((c) => c.id))
    for (const i of ITEMS) {
      expect(setIds.has(i.set)).toBe(true)
      expect(catIds.has(i.category)).toBe(true)
    }
    for (const c of CATEGORIES) expect(ITEMS.some((i) => i.category === c.id)).toBe(true)
    expect(ITEMS.length).toBeGreaterThanOrEqual(45)
  })

  it('keeps wall items one slot wide and rugs on the rug layer', () => {
    for (const i of ITEMS.filter((x) => x.layer === 'wall')) expect([i.w, i.d]).toEqual([1, 1])
    expect(ITEMS.filter((x) => x.category === 'rugs').every((x) => x.layer === 'rug')).toBe(true)
  })

  it('rates rarity by price', () => {
    expect(rarityOf(30)).toBe('common')
    expect(rarityOf(150)).toBe('rare')
    expect(rarityOf(300)).toBe('epic')
    expect(rarityOf(500)).toBe('legendary')
  })
})

describe('rugs', () => {
  it('sit under furniture but not on top of each other', () => {
    const r = placeItem(newRestaurant(0), 'rugred', 1, 1)
    expect(canPlace(r, 'bench', 1, 1, 6)).toBe(true) // furniture over a rug
    expect(canPlace(r, 'rugwave', 2, 2, 6)).toBe(false) // rug over rug
    expect(canPlace(r, 'rugwave', 3, 3, 6)).toBe(true)
    expect(canPlace(placeItem(newRestaurant(0), 'bench', 1, 1), 'rugred', 1, 1, 6)).toBe(true) // rug under furniture
  })
})

describe('wall decor', () => {
  const r = newRestaurant(0)

  it('keeps off the window and the door', () => {
    for (const grid of [5, 6, 7, 8]) {
      const win = windowSpan(grid)
      const door = doorSpan(grid)
      expect(win.u).toBeGreaterThan(0)
      expect(win.u + win.w).toBeLessThanOrEqual(grid * 32 + 12)
      expect(fixedSlots('L', grid).size).toBeGreaterThan(0)
      expect(fixedSlots('R', grid).size).toBeGreaterThan(0)
      expect(door.w).toBe(56)
    }
    const winSlot = [...fixedSlots('L', 6)][0]
    expect(canPlaceWall(r, 'scroll', 'L', winSlot, 6)).toBe(false)
  })

  it('places one item per slot and never floor items on walls', () => {
    const free = [0, 1, 2, 3, 4, 5].find((s) => !fixedSlots('R', 6).has(s))!
    expect(canPlaceWall(r, 'scroll', 'R', free, 6)).toBe(true)
    const hung = placeWall(r, 'scroll', 'R', free)
    expect(canPlaceWall(hung, 'mask', 'R', free, 6)).toBe(false)
    expect(canPlaceWall(hung, 'mask', 'L', free, 6)).toBe(!fixedSlots('L', 6).has(free))
    expect(canPlaceWall(r, 'table', 'R', free, 6)).toBe(false)
    expect(canPlace(r, 'scroll', 0, 0, 6)).toBe(false)
  })
})

describe('style sets', () => {
  it('rewards collecting items from one set', () => {
    expect(setBonusRate(2)).toBe(0)
    expect(setBonusRate(3)).toBe(0.1)
    expect(setBonusRate(5)).toBe(0.2)
    expect(setBonusRate(8)).toBe(0.35)
  })

  it('raises the decor score when a set fills up', () => {
    let r: Restaurant = { ...newRestaurant(0), items: [] }
    r = placeItem(r, 'bonsai', 0, 0)
    r = placeItem(r, 'bamboo', 1, 0)
    const two = decorScore(r)
    expect(two).toBe(22 + 26)
    r = placeItem(r, 'stonelantern', 2, 0)
    expect(decorScore(r)).toBe(Math.round((22 + 26 + 40) * 1.1))
    const prog = setProgress(r).find((s) => s.set === 'zen')!
    expect(prog.count).toBe(3)
    expect(prog.next).toBe(5)
  })
})

import {
  allItems, applyStorey, BUILD, buildStorey, buyUpgrade, EXPAND, expandStorey, hasStorey, nextExpansion, nextUpgrade, sizeOf, storeys, storeyView,
  SIZE_STEPS, UPGRADES, upgradeLevel,
} from './restaurant'

describe('growing the building', () => {
  it('starts small and grows one step at a time with rising prices', () => {
    let r = newRestaurant(0)
    expect(sizeOf(r, 'ground')).toBe(5)
    expect(nextExpansion(r, 'ground')).toEqual({ size: 6, ...EXPAND[6] })
    const costs: number[] = []
    while (nextExpansion(r, 'ground')) {
      costs.push(nextExpansion(r, 'ground')!.cost)
      r = expandStorey(r, 'ground')
    }
    expect(sizeOf(r, 'ground')).toBe(10)
    expect(costs).toEqual([...costs].sort((a, b) => a - b))
    expect(nextExpansion(r, 'ground')).toBeNull()
    expect(SIZE_STEPS.ground.at(-1)).toBe(10)
  })

  it('adds an upstairs lounge and a rooftop that start empty with sensible themes', () => {
    let r = newRestaurant(0)
    expect(hasStorey(r, 'upstairs')).toBe(false)
    r = buildStorey(buildStorey(r, 'upstairs'), 'rooftop')
    expect(hasStorey(r, 'upstairs')).toBe(true)
    expect(r.upstairs).toMatchObject({ items: [], size: 5, floor: 'wood' })
    expect(r.rooftop).toMatchObject({ items: [], size: 5, floor: 'deck' })
    expect(buildStorey(r, 'upstairs')).toBe(r)
    expect(BUILD.rooftop.cost).toBeGreaterThan(BUILD.upstairs.cost)
    expect(storeys(r).map((s) => s.id)).toEqual(['ground', 'upstairs', 'rooftop'])
    expect(expandStorey(r, 'rooftop').rooftop!.size).toBe(6)
  })

  it('edits one storey through a view without touching the others', () => {
    let r = buildStorey(newRestaurant(0), 'upstairs')
    const view = storeyView(r, 'upstairs')
    expect(view.items).toEqual([])
    const edited = placeItem(view, 'booth', 0, 0)
    r = applyStorey(r, 'upstairs', edited)
    expect(r.upstairs!.items).toHaveLength(1)
    expect(r.items).toHaveLength(4) // ground floor unchanged
    expect(r.nextId).toBe(edited.nextId) // ids stay unique across floors
    expect(allItems(r)).toHaveLength(5)
  })

  it('counts items and set bonuses across every storey', () => {
    let r = buildStorey(newRestaurant(0), 'rooftop')
    const before = decorScore(r)
    r = applyStorey(r, 'rooftop', placeItem(storeyView(r, 'rooftop'), 'sakura', 0, 0))
    expect(decorScore(r)).toBeGreaterThan(before)
    // Bonsai on the ground floor plus a sakura on the roof: both Zen, counted together.
    expect(allItems(r).filter((p) => p.type === 'bonsai' || p.type === 'sakura')).toHaveLength(2)
  })

  it('more seats and upgrades earn more tips, and a bigger jar holds more', () => {
    const r = newRestaurant(0)
    expect(tipsPerHour(100, 10)).toBeGreaterThan(tipsPerHour(100, 4))
    expect(tipsPerHour(100, 4, 3)).toBeGreaterThan(tipsPerHour(100, 4, 0))
    expect(tipCapHours(3)).toBe(12)
    expect(seatTotal(r)).toBe(3)
  })

  it('upgrades step up in price and stop at the last tier', () => {
    let r = newRestaurant(0)
    for (const k of ['register', 'menu'] as const) {
      const prices = UPGRADES[k].steps.map((s) => s.cost)
      expect(prices).toEqual([...prices].sort((a, b) => a - b))
    }
    expect(upgradeLevel(r, 'menu')).toBe(0)
    r = buyUpgrade(r, 'menu')
    expect(upgradeLevel(r, 'menu')).toBe(1)
    expect(upgradeLevel(r, 'register')).toBe(0)
    r = buyUpgrade(buyUpgrade(r, 'menu'), 'menu')
    expect(nextUpgrade(r, 'menu')).toBeNull()
    expect(nextUpgrade(r, 'register')).toEqual(UPGRADES.register.steps[0])
  })
})

import { loadRestaurant } from './restaurant'

describe('loading older saves', () => {
  it('keeps the room size players already had, and defaults new players to 5', () => {
    const store = new Map<string, string>()
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as Storage
    try {
      expect(loadRestaurant(0).size).toBe(5)
      // A save from before expansions: level-6 players had an 8x8 room.
      const old = { ...newRestaurant(0), peak: 6 } as Partial<Restaurant>
      delete old.size
      store.set('bentopia.restaurant', JSON.stringify(old))
      expect(loadRestaurant(0).size).toBe(gridSize(6))
      store.set('bentopia.restaurant', JSON.stringify({ ...newRestaurant(0), size: 7 }))
      expect(loadRestaurant(0).size).toBe(7)
      // Unknown items from other versions are dropped, upper floors are kept.
      store.set('bentopia.restaurant', JSON.stringify({ ...newRestaurant(0), upstairs: { items: [{ id: 9, type: 'nope', gx: 0, gy: 0 }, { id: 10, type: 'booth', gx: 0, gy: 0 }], size: 6 } }))
      expect(loadRestaurant(0).upstairs?.items.map((p) => p.type)).toEqual(['booth'])
    } finally {
      delete (globalThis as Partial<{ localStorage: unknown }>).localStorage
    }
  })
})