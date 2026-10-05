import { describe, expect, it } from 'vitest'
import { earn, HEART_MS, levelReward, loseHeart, MAX_HEARTS, newWallet, refundHeart, spend, tick } from './economy'

describe('hearts', () => {
  it('starts full and loses one per failure, starting the regen clock', () => {
    const w = loseHeart(newWallet(), 1000)
    expect(w.hearts).toBe(MAX_HEARTS - 1)
    expect(w.regenAt).toBe(1000 + HEART_MS)
  })

  it('regenerates one heart per 30 minutes, including after being away a long time', () => {
    let w = newWallet()
    for (let i = 0; i < 3; i++) w = loseHeart(w, 0)
    expect(w.hearts).toBe(2)
    expect(tick(w, HEART_MS - 1).hearts).toBe(2)
    expect(tick(w, HEART_MS).hearts).toBe(3)
    const later = tick(w, HEART_MS * 10)
    expect(later.hearts).toBe(MAX_HEARTS)
    expect(later.regenAt).toBeNull()
  })

  it('never goes below zero', () => {
    let w = newWallet()
    for (let i = 0; i < 8; i++) w = loseHeart(w, 0)
    expect(w.hearts).toBe(0)
  })

  it('refunds a heart without exceeding the max and clears the timer when full', () => {
    const w = refundHeart(loseHeart(newWallet(), 0))
    expect(w.hearts).toBe(MAX_HEARTS)
    expect(w.regenAt).toBeNull()
    expect(refundHeart(w).hearts).toBe(MAX_HEARTS)
  })
})

describe('coins', () => {
  it('pays more for stars and spare moves, and 40% on replays', () => {
    expect(levelReward(3, 10, true)).toBe(70)
    expect(levelReward(1, 0, true)).toBe(30)
    expect(levelReward(3, 10, false)).toBe(28)
  })

  it('refuses to spend more than you have', () => {
    const w = earn(newWallet(), 60)
    expect(spend(w, 50)?.coins).toBe(10)
    expect(spend(w, 61)).toBeNull()
  })
})
