import { FIRST_MIXED_KIND } from './items'
import type { LevelDef, OrderItem } from './types'

const FULL = ['........', '........', '........', '........', '........', '........', '........', '........']
const CORNERS = ['#......#', '........', '........', '........', '........', '........', '........', '#......#']
const CENTER = ['........', '........', '........', '...##...', '...##...', '........', '........', '........']
const BARS = ['........', '.##..##.', '........', '........', '........', '........', '.##..##.', '........']
const DIAMOND = ['##....##', '#......#', '........', '........', '........', '........', '#......#', '##....##']

const o = (kind: number, tier: number, count: number): OrderItem => ({ kind, tier, count })

/** name, shape, raw ingredient kinds on the board, order, and optional move slack. */
type Spec = [name: string, shape: string[], kinds: number, order: OrderItem[], slack?: number]

/**
 * The curve is deliberately slow. Each chapter introduces one idea, then repeats it with only a small
 * step up in size or shape, and every level is tuned so a simple greedy bot clears it most of the time.
 */
const SPECS: Spec[] = [
  // Chapter 1: learn the kitchen. First single chains, then your first dishes.
  ['First roll', FULL, 4, [o(0, 1, 3)]],
  ['Rice for two', FULL, 4, [o(0, 1, 4)]],
  ['Fish supper', FULL, 4, [o(1, 1, 4)]],
  ['Corner table', CORNERS, 4, [o(0, 1, 3), o(1, 1, 3)]],
  ['Cucumber crunch', CENTER, 4, [o(2, 1, 5)]],
  ['Triple order', FULL, 5, [o(0, 1, 3), o(1, 1, 3), o(2, 1, 3)]],
  ['The bento box', FULL, 4, [o(0, 2, 1)], 4.4],
  ['Sashimi plate', CORNERS, 4, [o(1, 2, 1)], 4.2],
  ['Salad and rice', CENTER, 5, [o(2, 2, 1), o(0, 1, 3)], 4.6],
  ['Lunch rush', FULL, 5, [o(0, 2, 1), o(1, 1, 3)], 4.6],
  ['Double bento', FULL, 4, [o(0, 2, 2)], 3.8],
  ['Two dishes', FULL, 5, [o(0, 2, 1), o(1, 2, 1)], 4.6],

  // Chapter 2: mix it up. Link one of each ingredient.
  ['Mix it up', FULL, 5, [o(6, 2, 1)], 4.4],
  ['Tempura roll', FULL, 5, [o(7, 2, 1)], 4.2],
  ['Skewer party', FULL, 6, [o(8, 2, 1)], 4.2],
  ['Rainbow maki', FULL, 6, [o(9, 2, 1)], 4.2],
  ['Chirashi and fish', CORNERS, 5, [o(6, 2, 1), o(1, 1, 3)], 4],
  ['Double chirashi', CORNERS, 5, [o(6, 2, 2)], 4],
  ['Two specials', FULL, 6, [o(6, 2, 1), o(7, 2, 1)], 3.8],
  ['Feast for two', CENTER, 6, [o(8, 2, 1), o(9, 2, 1)], 3.8],
  ['Surf and turf', CORNERS, 6, [o(6, 2, 1), o(2, 2, 1)], 5],
  ['Tempura twins', CENTER, 6, [o(7, 2, 2)], 3.8],
  ['Skewers times two', FULL, 6, [o(8, 2, 2)], 3.8],
  ['Grand banquet', FULL, 6, [o(6, 2, 1), o(7, 2, 1), o(8, 2, 1)], 3.8],

  // Chapter 3: service rush. Bigger orders and trickier boards, still a gentle climb.
  ['Rainbow pair', FULL, 6, [o(9, 2, 2)], 3.8],
  ['Dish and chirashi', FULL, 6, [o(6, 2, 1), o(0, 2, 1)], 4.8],
  ['Fish feast', FULL, 6, [o(7, 2, 1), o(9, 2, 1), o(1, 2, 1)], 4.6],
  ['Bars and bowls', BARS, 6, [o(8, 2, 1), o(9, 2, 1)], 3.8],
  ['Triple treat', FULL, 6, [o(6, 2, 1), o(7, 2, 1), o(9, 2, 1)], 3.6],
  ['Diamond dinner', DIAMOND, 6, [o(6, 2, 2), o(7, 2, 1)], 3.6],
  ['Island kitchen', CENTER, 6, [o(8, 2, 2), o(9, 2, 1)], 3.6],
  ['Midnight menu', BARS, 6, [o(7, 2, 2), o(8, 2, 1)], 3.6],
  ['Four courses', FULL, 6, [o(6, 2, 1), o(7, 2, 1), o(8, 2, 1), o(9, 2, 1)], 3.5],
  ["Chef's choice", DIAMOND, 6, [o(9, 2, 3)], 3.5],
  ['Banquet for six', FULL, 6, [o(6, 2, 2), o(8, 2, 2)], 3.5],
  ['Grand finale', FULL, 6, [o(6, 2, 2), o(7, 2, 2), o(9, 2, 1)], 3.5],
]

// A tier-1 item takes one link, a tier-2 item takes four (3 tier-1s plus the final link).
function minLinks(order: OrderItem[]): number {
  return order.reduce((sum, item) => sum + item.count * (item.tier === 1 ? 1 : 4), 0)
}

/** Default room for error when a level does not set its own. */
function defaultSlack(order: OrderItem[]): number {
  if (order.some((i) => i.kind >= FIRST_MIXED_KIND)) return 3.4
  if (order.some((i) => i.tier === 2)) return 3.2
  return 1.9
}

export const LEVELS: LevelDef[] = SPECS.map(([name, shape, kinds, order, slack], i) => ({
  id: i + 1,
  name,
  shape,
  kinds,
  order,
  moves: Math.ceil(minLinks(order) * (slack ?? defaultSlack(order))) + 3,
}))

/** Chapter boundaries (inclusive level ids), shared by the map and the hub. */
export const CHAPTER_RANGES: { title: string; sub: string; from: number; to: number }[] = [
  { title: 'Chapter 1', sub: 'Learn the kitchen', from: 1, to: 12 },
  { title: 'Chapter 2', sub: 'Mix it up', from: 13, to: 24 },
  { title: 'Chapter 3', sub: 'Service rush', from: 25, to: 36 },
]

export const chapterOf = (levelId: number) => CHAPTER_RANGES.findIndex((c) => levelId >= c.from && levelId <= c.to) + 1