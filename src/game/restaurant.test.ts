import { describe, expect, it } from 'vitest'
import {
  canPlace, collectTips, decorScore, footprint, gridSize, ITEMS, levelOf, levelProgress, moveItem, newRestaurant, placeItem, withPeak,
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
    expect(base).toBe(18 + 9 + 15 + 22)
    expect(decorScore({ ...r, floor: 'tatami' })).toBe(base + 12)
    expect(decorScore(placeItem(r, 'torii', 0, 4))).toBe(base + 170)
  })

  it('maps score to levels and room size', () => {
    expect(restaurantLevel(0)).toBe(1)
    expect(restaurantLevel(119)).toBe(1)
    expect(restaurantLevel(120)).toBe(2)
    expect(restaurantLevel(5000)).toBe(5)
    expect(gridSize(1)).toBe(5)
    expect(gridSize(5)).toBe(7)
    expect(levelProgress(70)).toEqual({ have: 70, need: 120, level: 1 })
    expect(levelProgress(2000)).toBeNull()
  })

  it('every item can be bought at its unlock level and has a sane price', () => {
    for (const i of ITEMS) {
      expect(i.price).toBeGreaterThan(0)
      expect(i.value).toBeGreaterThan(0)
      expect(i.unlock).toBeGreaterThanOrEqual(1)
      expect(i.unlock).toBeLessThanOrEqual(5)
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
    const perHour = 5 + decorScore(r) * 0.15
    expect(tipsAccrued(r, 0)).toBe(0)
    expect(tipsAccrued(r, HOUR)).toBe(Math.floor(perHour))
    expect(tipsAccrued(r, 100 * HOUR)).toBe(Math.floor(6 * perHour))
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
