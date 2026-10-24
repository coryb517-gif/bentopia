import { describe, expect, it } from 'vitest'
import { addPoints, anyClaimable, claimable, claimTier, newRegulars, POSTCARDS, tierReached, TIERS } from './regulars'
import { CUSTOMERS } from './Customers'

describe('regulars', () => {
  it('every customer has a postcard for every friendship level', () => {
    for (const c of CUSTOMERS) expect(POSTCARDS[c.id]).toHaveLength(TIERS.length)
  })
  it('reaches levels at the thresholds', () => {
    expect([0, 2, 3, 8, 14, 15, 25, 99].map(tierReached)).toEqual([0, 0, 1, 2, 2, 3, 4, 4])
  })
  it('claims one level at a time and pays the right gift', () => {
    let r = addPoints(newRegulars(), 'obaa', 8)
    expect(claimable(r, 'obaa')).toBe(true)
    expect(anyClaimable(r)).toBe(true)
    const a = claimTier(r, 'obaa')!
    expect(a.coins).toBe(40)
    r = a.next
    const b = claimTier(r, 'obaa')!
    expect(b.coins).toBe(80)
    expect(claimTier(b.next, 'obaa')).toBeNull()
    expect(anyClaimable(b.next)).toBe(false)
  })
})
