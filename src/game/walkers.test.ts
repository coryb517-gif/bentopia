import { describe, expect, it } from 'vitest'
import { blockedTiles, entranceTile, findPath, reachable, standingSpots, type Pt } from './walkers'
import { newRestaurant, placeItem } from './restaurant'

const blockedOf = (cells: Pt[]) => new Set(cells.map((c) => `${c[0]},${c[1]}`))

describe('walking around furniture', () => {
  it('finds the shortest route on an empty floor', () => {
    const path = findPath(new Set(), 5, [0, 0], [3, 2])!
    expect(path).toHaveLength(5)
    expect(path.at(-1)).toEqual([3, 2])
    expect(findPath(new Set(), 5, [1, 1], [1, 1])).toEqual([])
  })

  it('goes around obstacles and never steps on them', () => {
    const wall = blockedOf([[1, 0], [1, 1], [1, 2], [1, 3]])
    const path = findPath(wall, 5, [0, 0], [2, 0])!
    expect(path.length).toBeGreaterThan(2)
    for (const [x, y] of path) expect(wall.has(`${x},${y}`)).toBe(false)
    // Fully walled off: no route.
    const sealed = blockedOf([[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]])
    expect(findPath(sealed, 5, [0, 0], [2, 0])).toBeNull()
    // Destination itself is furniture: no route.
    expect(findPath(wall, 5, [0, 0], [1, 1])).toBeNull()
  })

  it('knows what is reachable and how far', () => {
    const wall = blockedOf([[2, 0], [2, 1], [2, 2]])
    const reach = reachable(wall, 4, [0, 0])
    expect(reach.get('0,0')).toBe(0)
    expect(reach.has('2,1')).toBe(false)
    expect(reach.get('3,0')).toBe(9) // around the end of the wall
  })

  it('treats only floor furniture as blocking, and honours two-tile and rotated items', () => {
    let r = newRestaurant(0)
    r = placeItem(r, 'counter', 0, 3) // 2x1 along x: (0,3) and (1,3)
    r = placeItem(r, 'rugred', 3, 3) // rugs never block
    const blocked = blockedTiles(r)
    expect(blocked.has('1,3')).toBe(true)
    expect(blocked.has('3,3')).toBe(false)
    const flipped = blockedTiles(placeItem(newRestaurant(0), 'counter', 0, 3, true)) // now 1x2: (0,3) and (0,4)
    expect(flipped.has('0,4')).toBe(true)
    expect(flipped.has('1,3')).toBe(false)
  })

  it('finds standing spots beside furniture and a door tile that is always free', () => {
    const cells: Pt[] = [[2, 2]]
    const spots = standingSpots(new Set(), 5, cells)
    expect(spots).toHaveLength(4)
    expect(standingSpots(blockedOf([[1, 2], [3, 2], [2, 1]]), 5, cells)).toEqual([[2, 3]])
    const door = entranceTile(new Set(), 7)!
    expect(door[1]).toBe(0)
    // Furniture on the doorstep: the nearest free tile is used instead.
    const blocked = blockedOf([[door[0], 0]])
    const moved = entranceTile(blocked, 7)!
    expect(blocked.has(`${moved[0]},${moved[1]}`)).toBe(false)
    expect(Math.abs(moved[0] - door[0]) + moved[1]).toBe(1)
  })
})
