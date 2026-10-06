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
  /** A name the player typed. Overrides the listed name. */
  custom?: string
}

export const NAMES = ['Mika', 'Ren', 'Sora', 'Hana', 'Kenji', 'Yuki', 'Taro', 'Aiko', 'Haru', 'Momo', 'Daiki', 'Nori']
export const SKINS = ['#ffe1c4', '#f4c7a0', '#d9a073', '#a9714b', '#7a4a30', '#4f2f20']
export const HAIRS = ['Bob', 'Spiky', 'Bun', 'Long', 'Buzz']
export const HAIR_COLORS = ['#2b1d2e', '#6a3a22', '#c88a3a', '#e8c25a', '#ff7fc0', '#6dc7ff', '#d0d0e0']
export const OUTFITS = ['#ff5b6e', '#ffb347', '#6dffc0', '#7fe6ff', '#d29bff', '#fff6e0']
export const ACCESSORIES = ['None', 'Glasses', 'Headband', 'Chef hat', 'Cat ears']

type Choice = Exclude<keyof Avatar, 'custom'>

export const OPTION_COUNTS: Record<Choice, number> = {
  name: NAMES.length,
  skin: SKINS.length,
  hair: HAIRS.length,
  hairColor: HAIR_COLORS.length,
  outfit: OUTFITS.length,
  accessory: ACCESSORIES.length,
}

export const NAME_MAX = 14

/** Letters, spaces, hyphens and apostrophes only, trimmed and capped. Anything else is dropped. */
export function sanitizeName(s: string): string {
  return s
    .replace(/[^\p{L}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim()
}

/** What to call the player: their own name if they typed one, else the one they picked. */
export const avatarName = (a: Avatar): string => a.custom || NAMES[a.name]

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
  for (const k of Object.keys(OPTION_COUNTS) as Choice[]) {
    const v = (raw as Record<string, unknown>)[k]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= OPTION_COUNTS[k]) return null
    out[k] = v
  }
  const custom = sanitizeName(String((raw as Record<string, unknown>).custom ?? ''))
  if (custom) out.custom = custom
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
