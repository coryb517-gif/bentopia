/**
 * The player's character. Everything is picked from lists, never typed, so there is nothing to moderate
 * and the whole avatar fits in a few small numbers (ready to sync to a server later).
 */
export interface Avatar {
  name: number
  skin: number
  hair: number
  hairColor: number
  outfit: number
  accessory: number
}

export const NAMES = ['Mika', 'Ren', 'Sora', 'Hana', 'Kenji', 'Yuki', 'Taro', 'Aiko', 'Haru', 'Momo', 'Daiki', 'Nori']
export const SKINS = ['#ffe1c4', '#f4c7a0', '#d9a073', '#a9714b', '#7a4a30', '#4f2f20']
export const HAIRS = ['Bob', 'Spiky', 'Bun', 'Long', 'Buzz']
export const HAIR_COLORS = ['#2b1d2e', '#6a3a22', '#c88a3a', '#e8c25a', '#ff7fc0', '#6dc7ff', '#d0d0e0']
export const OUTFITS = ['#ff5b6e', '#ffb347', '#6dffc0', '#7fe6ff', '#d29bff', '#fff6e0']
export const ACCESSORIES = ['None', 'Glasses', 'Headband', 'Chef hat', 'Cat ears']

export const OPTION_COUNTS: Record<keyof Avatar, number> = {
  name: NAMES.length,
  skin: SKINS.length,
  hair: HAIRS.length,
  hairColor: HAIR_COLORS.length,
  outfit: OUTFITS.length,
  accessory: ACCESSORIES.length,
}

export const DEFAULT_AVATAR: Avatar = { name: 0, skin: 1, hair: 0, hairColor: 0, outfit: 0, accessory: 0 }

export function randomAvatar(next: () => number = Math.random): Avatar {
  const pick = (n: number) => Math.floor(next() * n)
  return {
    name: pick(NAMES.length),
    skin: pick(SKINS.length),
    hair: pick(HAIRS.length),
    hairColor: pick(HAIR_COLORS.length),
    outfit: pick(OUTFITS.length),
    accessory: pick(ACCESSORIES.length),
  }
}

/** Clamp anything read from storage into valid choices. */
export function cleanAvatar(raw: unknown): Avatar | null {
  if (!raw || typeof raw !== 'object') return null
  const out = { ...DEFAULT_AVATAR }
  for (const k of Object.keys(OPTION_COUNTS) as (keyof Avatar)[]) {
    const v = (raw as Record<string, unknown>)[k]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= OPTION_COUNTS[k]) return null
    out[k] = v
  }
  return out
}

const KEY = 'bentopia.avatar'

export function loadAvatar(): Avatar | null {
  try {
    return cleanAvatar(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function saveAvatar(a: Avatar) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    // Private mode or full storage: the avatar lasts this session.
  }
}
