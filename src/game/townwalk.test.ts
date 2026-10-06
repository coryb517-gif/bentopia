import { describe, expect, it } from 'vitest'
import { along, findRoute, nearestWalkable, routeLength, walkable, type TownGeometry } from './townwalk'
import { cleanAvatar, DEFAULT_AVATAR, OPTION_COUNTS, randomAvatar } from './avatar'

const g: TownGeometry = {
  size: 14,
  lots: [[1, 1, 3.2], [8.4, 1, 3.2], [1, 8.4, 3.2], [8.4, 8.4, 3.2], [4.6, 4.6, 3.2]],
  bridge: { x0: 6, x1: 7.6, yEnd: 17 },
}

describe('walking the town', () => {
  it('cannot enter buildings and stays on the plaza', () => {
    expect(walkable(g, [2.5, 2.5])).toBe(false)
    expect(walkable(g, [4.4, 2.5])).toBe(true)
    expect(walkable(g, [-1, 5])).toBe(false)
    expect(walkable(g, [6.8, 15])).toBe(true) // on the bridge
    expect(walkable(g, [2, 15])).toBe(false) // in the river
  })

  it('finds a route around a building that never crosses one', () => {
    const route = findRoute(g, [0.6, 3], [12.5, 3])!
    expect(route).not.toBeNull()
    expect(routeLength(route)).toBeGreaterThanOrEqual(11.9)
    for (let i = 1; i < route.length; i++) {
      for (let t = 0; t <= 1; t += 0.05) {
        expect(walkable(g, [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t])).toBe(true)
      }
    }
  })

  it('sends a tap on a building to the pavement beside it', () => {
    const p = nearestWalkable(g, [2.5, 2.5])
    expect(walkable(g, p)).toBe(true)
    expect(Math.hypot(p[0] - 2.5, p[1] - 2.5)).toBeLessThan(2.4)
  })

  it('reaches the other side of the bridge', () => {
    const route = findRoute(g, [6.8, 12.5], [6.8, 16.5])!
    expect(route.at(-1)![1]).toBeGreaterThan(16)
  })

  it('walks along a route at a steady pace', () => {
    const route: [number, number][] = [[0, 0], [3, 0], [3, 4]]
    expect(routeLength(route)).toBe(7)
    expect(along(route, 1.5).pos).toEqual([1.5, 0])
    expect(along(route, 5).pos).toEqual([3, 2])
    expect(along(route, 99).done).toBe(true)
  })
})

describe('avatars', () => {
  it('only accept valid saved choices', () => {
    expect(cleanAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR)
    expect(cleanAvatar({ ...DEFAULT_AVATAR, skin: 99 })).toBeNull()
    expect(cleanAvatar('x')).toBeNull()
    const a = randomAvatar()
    for (const k of Object.keys(OPTION_COUNTS) as (keyof typeof OPTION_COUNTS)[]) expect(a[k]).toBeLessThan(OPTION_COUNTS[k])
  })
})
