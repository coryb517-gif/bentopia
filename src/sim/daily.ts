import { nextRandom } from './rng'
import type { LevelDef, OrderItem } from './types'

/** Day one of the Daily Challenge. */
const EPOCH = '2026-10-01'

const SHAPES = [
  ['........', '........', '........', '........', '........', '........', '........', '........'],
  ['#......#', '........', '........', '........', '........', '........', '........', '#......#'],
  ['........', '........', '........', '...##...', '...##...', '........', '........', '........'],
  ['........', '.##..##.', '........', '........', '........', '........', '.##..##.', '........'],
  ['##....##', '#......#', '........', '........', '........', '........', '#......#', '##....##'],
  ['##....##', '##....##', '........', '........', '........', '........', '##....##', '##....##'],
]

const NAMES = ['Sunrise special', 'Lantern lunch', 'Midnight menu', 'Chef’s gamble', 'Rush hour', 'Quiet corner', 'Festival feast', 'Moonlit maki']

/** Which challenge number a local day key like 2026-10-16 is (the first day is 1). */
export const dailyNumber = (key: string): number => Math.round((Date.parse(key + 'T00:00:00Z') - Date.parse(EPOCH + 'T00:00:00Z')) / 86_400_000) + 1

const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** The board seed for a day: the same tiles drop for everyone. */
export const dailySeed = (key: string): number => hash('board' + key)

/** The same level for everyone on a given day. Level id 0 keeps it out of the story's stars and characters. */
export function dailyLevel(key: string): LevelDef {
  let rng = hash(key)
  const roll = (n: number): number => {
    const [s, v] = nextRandom(rng)
    rng = s
    return Math.floor(v * n)
  }
  const shape = SHAPES[roll(SHAPES.length)]
  const lines = 2 + roll(2)
  const kinds = [6, 7, 8, 9].sort(() => roll(3) - 1).slice(0, lines)
  const order: OrderItem[] = kinds.map((k) => ({ kind: k, tier: 2, count: 1 + (roll(3) === 0 ? 1 : 0) }))
  const ice = 2 + roll(4)
  const links = order.reduce((n, o) => n + o.count * 4, 0)
  return {
    id: 0,
    name: `${NAMES[roll(NAMES.length)]}`,
    shape,
    kinds: 6,
    order,
    moves: Math.ceil(links * 3.8) + 3 + Math.ceil(ice * 0.7),
    ice,
    luck: 0.07,
  }
}
