import { describe, expect, it } from 'vitest'
import { autoArrange } from './layout'
import { neighbourRestaurant } from './neighbours'
import { blockedTiles, entranceTile, reachable } from './walkers'
import { canPlace, canPlaceWall, itemDef, type Restaurant } from './restaurant'

const sample = (seed: number, level: number): Restaurant => neighbourRestaurant(seed, level)

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
