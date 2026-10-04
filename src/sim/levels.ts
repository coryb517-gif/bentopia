import type { LevelDef, OrderItem } from './types'

const FULL = ['........', '........', '........', '........', '........', '........', '........', '........']
const CORNERS = ['#......#', '........', '........', '........', '........', '........', '........', '#......#']
const CENTER = ['........', '........', '........', '...##...', '...##...', '........', '........', '........']
const BARS = ['........', '.##..##.', '........', '........', '........', '........', '.##..##.', '........']
const DIAMOND = ['##....##', '#......#', '........', '........', '........', '........', '#......#', '##....##']

const o = (kind: number, tier: number, count: number): OrderItem => ({ kind, tier, count })

type Spec = [name: string, shape: string[], kinds: number, order: OrderItem[]]

const SPECS: Spec[] = [
  ['First roll', FULL, 4, [o(0, 1, 3)]],
  ['Rice for two', FULL, 4, [o(0, 1, 4)]],
  ['Corner table', CORNERS, 4, [o(0, 1, 3), o(1, 1, 3)]],
  ['Center island', CENTER, 4, [o(2, 1, 4)]],
  ['The bento box', FULL, 4, [o(0, 2, 1)]],
  ['Lunch rush', CORNERS, 5, [o(0, 2, 1), o(1, 1, 3)]],
  ['Salad bar', CENTER, 5, [o(1, 2, 1), o(2, 1, 3)]],
  ['Two dishes', BARS, 5, [o(0, 2, 1), o(1, 2, 1)]],
  ['Egg and shrimp', DIAMOND, 5, [o(3, 2, 1), o(4, 1, 4)]],
  ['Head chef test', FULL, 6, [o(0, 2, 2), o(1, 1, 3), o(2, 1, 3)]],
]

// A tier-1 item takes one link, a tier-2 item takes four (3 tier-1s plus the final link).
function minLinks(order: OrderItem[]): number {
  return order.reduce((sum, item) => sum + item.count * (item.tier === 1 ? 1 : 4), 0)
}

export const LEVELS: LevelDef[] = SPECS.map(([name, shape, kinds, order], i) => ({
  id: i + 1,
  name,
  shape,
  kinds,
  order,
  moves: Math.ceil(minLinks(order) * 1.9) + 3,
}))
