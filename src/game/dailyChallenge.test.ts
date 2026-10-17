import { describe, expect, it } from 'vitest'
import { newDailyRecord, recordWin, shareText, streakNow, wonToday } from './dailyChallenge'

describe('daily challenge record', () => {
  it('pays once a day and builds a streak on consecutive days', () => {
    let d = newDailyRecord()
    let r = recordWin(d, '2026-10-16', 2, 5)
    expect(r.first).toBe(true)
    expect(r.next.streak).toBe(1)
    d = r.next
    r = recordWin(d, '2026-10-16', 3, 2)
    expect(r.first).toBe(false)
    expect(r.next.stars).toBe(3)
    d = r.next
    r = recordWin(d, '2026-10-17', 1, 0)
    expect(r.first).toBe(true)
    expect(r.next.streak).toBe(2)
    expect(wonToday(r.next, '2026-10-17')).toBe(true)
    expect(wonToday(r.next, '2026-10-18')).toBe(false)
  })
  it('keeps a better result and resets after a missed day', () => {
    const d = recordWin(recordWin(newDailyRecord(), '2026-10-16', 3, 4).next, '2026-10-16', 2, 9).next
    expect(d.stars).toBe(3)
    expect(streakNow(d, '2026-10-17')).toBe(1)
    expect(streakNow(d, '2026-10-18')).toBe(0)
    expect(recordWin(d, '2026-10-19', 1, 0).next.streak).toBe(1)
  })
  it('writes a share message', () => {
    const t = shareText('2026-10-16', 2, 6, 3)
    expect(t).toContain('Daily #16')
    expect(t).toContain('6 moves to spare')
    expect(t).toContain('3 day streak')
    expect(t).toContain('bentopia.cdblogic.com')
  })
})
