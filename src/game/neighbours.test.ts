import { describe, expect, it } from 'vitest'
import { neighbourRestaurant } from './neighbours'
import { canPlace, seatTotal } from './restaurant'

describe('neighbour restaurants', () => {
  it('are the same every time for the same shop', () => {
    expect(neighbourRestaurant(3, 4)).toEqual(neighbourRestaurant(3, 4))
    expect(neighbourRestaurant(3, 4)).not.toEqual(neighbourRestaurant(4, 4))
  })

  it('grow with level, never overlap, and have seats', () => {
    const small = neighbourRestaurant(1, 2)
    const big = neighbourRestaurant(1, 6)
    expect(big.size!).toBeGreaterThan(small.size!)
    expect(big.items.length).toBeGreaterThan(small.items.length)
    expect(seatTotal(big)).toBeGreaterThan(0)
    for (const r of [small, big]) {
      for (const p of r.items.filter((i) => !i.wall)) {
        const without = { ...r, items: r.items.filter((i) => i.id !== p.id) }
        expect(canPlace(without, p.type, p.gx, p.gy, r.size!, undefined, p.flip)).toBe(true)
      }
    }
  })
})
