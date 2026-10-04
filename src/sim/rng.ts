/** Deterministic mulberry32. State is a plain uint32 so it can live in game state. */
export function nextRandom(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) >>> 0
  let t = s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [s, ((t ^ (t >>> 14)) >>> 0) / 4294967296]
}
