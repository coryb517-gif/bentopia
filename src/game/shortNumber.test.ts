import { describe, expect, it } from 'vitest'
import { shortNumber } from './Hub'

describe('header coin count', () => {
  it('shows normal totals in full and long ones compactly', () => {
    expect(shortNumber(0)).toBe('0')
    expect(shortNumber(1702)).toBe('1702')
    expect(shortNumber(99999)).toBe('99999')
    expect(shortNumber(123456)).toBe('123.5K')
    expect(shortNumber(1234567)).toBe('1.2M')
  })
})
