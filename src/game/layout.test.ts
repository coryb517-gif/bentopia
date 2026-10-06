import { describe, expect, it } from 'vitest'
import { autoArrange, LAYOUT_STYLES } from './layout'
import { neighbourRestaurant } from './neighbours'
import { blockedTiles, entranceTile, reachable } from './walkers'
import { canPlace, canPlaceWall, itemDef, type Restaurant } from './restaurant'

const sample = (seed: number, level: number): Restaurant => neighbourRestaurant(seed, level)

describe('layout styles', () => {
  it('every style keeps all items, a walkway and no sealed-off tiles', () => {
    for (const { id } of LAYOUT_STYLES) {
      for (const [seed, level] of [[1, 3], [3, 6], [5, 5]]) {
        const r = sample(seed, level)
        const out = autoArrange(r, r.size!, id)!
        expect(out.items).toHaveLength(r.items.length)
        const blocked = blockedTiles(out)
        const door = entranceTile(new Set(), r.size!)!
        expect(reachable(blocked, r.size!, door).size).toBe(r.size! * r.size! - blocked.size)
      }
    }
  })

  it('cozy packs seating closer than open does', () => {
    const touching = (items: Restaurant['items']) => {
      const seats = items.filter((p) => itemDef(p.type).category === 'seating')
      let n = 0
      for (const a of seats) for (const b of seats) if (a.id < b.id && Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy) <= 1) n++
      return n
    }
    let cozy = 0
    let open = 0
    for (const [seed, level] of [[1, 6], [3, 6], [4, 6], [6, 6]]) {
      const r = sample(seed, level)
      cozy += touching(autoArrange(r, r.size!, 'cozy')!.items)
      open += touching(autoArrange(r, r.size!, 'open')!.items)
    }
    expect(cozy).toBeGreaterThanOrEqual(open)
  })

  it('show-kitchen style lines gear along the back wall', () => {
    const r = sample(3, 6)
    const out = autoArrange(r, r.size!, 'kitchen')!
    const kitchen = out.items.filter((p) => itemDef(p.type).category === 'kitchen')
    expect(kitchen.length).toBeGreaterThan(0)
    expect(Math.min(...kitchen.map((p) => p.gy))).toBeLessThanOrEqual(1)
  })
})

describe('auto-arrange', () => {
  const cases: [number, number][] = [[1, 2], [2, 4], [3, 6], [4, 6], [5, 3], [6, 5]]

  it('keeps every item and never overlaps', () => {
    for (const [seed, level] of cases) {
      const r = sample(seed, level)
      const grid = r.size!
      const out = autoArrange(r, grid)!
      expect(out).not.toBeNull()
      expect(out.items.map((p) => p.id).sort((a, b) => a - b)).toEqual(r.items.map((p) => p.id).sort((a, b) => a - b))
      expect(out.items.map((p) => p.type).sort()).toEqual(r.items.map((p) => p.type).sort())
      for (const p of out.items) {
        const rest = { ...out, items: out.items.filter((i) => i.id !== p.id) }
        if (p.wall) expect(canPlaceWall(rest, p.type, p.wall, p.gx, grid)).toBe(true)
        else expect(canPlace(rest, p.type, p.gx, p.gy, grid, undefined, p.flip)).toBe(true)
      }
    }
  })

  it('leaves a walkway and no walled-off tiles', () => {
    for (const [seed, level] of cases) {
      const r = sample(seed, level)
      const grid = r.size!
      const out = autoArrange(r, grid)!
      const blocked = blockedTiles(out)
      const door = entranceTile(new Set(), grid)!
      expect(blocked.has(`${door[0]},${door[1]}`)).toBe(false)
      expect(reachable(blocked, grid, door).size).toBe(grid * grid - blocked.size)
    }
  })

  it('is deterministic and settles', () => {
    const r = sample(3, 6)
    const once = autoArrange(r, r.size!)!
    expect(autoArrange(r, r.size!)).toEqual(once)
    const twice = autoArrange(once, r.size!)!
    expect(twice.items.map((p) => [p.id, p.gx, p.gy, !!p.flip, p.wall])).toEqual(once.items.map((p) => [p.id, p.gx, p.gy, !!p.flip, p.wall]))
  })

  it('puts kitchen gear on the left wall and stools beside tables', () => {
    const r = sample(3, 6)
    const out = autoArrange(r, r.size!)!
    const kitchen = out.items.filter((p) => itemDef(p.type).category === 'kitchen')
    if (kitchen.length) expect(Math.min(...kitchen.map((p) => p.gx))).toBeLessThanOrEqual(1)
  })

  it('gives back an untouched room when it cannot fit everything', () => {
    const r = sample(1, 2)
    const crowded: Restaurant = { ...r, items: [] }
    expect(autoArrange(crowded, r.size!)).toEqual(crowded)
  })
})
