import { FIRST_MIXED_KIND } from './items'
import type { LevelDef, OrderItem } from './types'

const FULL = ['........', '........', '........', '........', '........', '........', '........', '........']
const CORNERS = ['#......#', '........', '........', '........', '........', '........', '........', '#......#']
const CENTER = ['........', '........', '........', '...##...', '...##...', '........', '........', '........']
const BARS = ['........', '.##..##.', '........', '........', '........', '........', '.##..##.', '........']
const STAIRS = ['#.......', '##......', '###.....', '........', '........', '.....###', '......##', '.......#']
const WINDOW = ['........', '.##..##.', '.##..##.', '........', '........', '.##..##.', '.##..##.', '........']
const CHAMFER = ['##....##', '##....##', '........', '........', '........', '........', '##....##', '##....##']
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

  // Chapter 4: master chef. Longer orders on odd-shaped boards. Try a 5-chain: it leaves a Flavor Bomb.
  ['Two by two', FULL, 6, [o(6, 2, 2), o(7, 2, 2)], 4.2],
  ['Stairway sushi', STAIRS, 6, [o(8, 2, 1), o(9, 2, 1)], 4.4],
  ['Window seats', WINDOW, 6, [o(6, 2, 1), o(7, 2, 1), o(8, 2, 1)], 4.2],
  ['Chamfer cuts', CHAMFER, 6, [o(9, 2, 2), o(1, 2, 1)], 4.6],
  ['Rainbow trio', FULL, 6, [o(9, 2, 3)], 4],
  ['All the classics', FULL, 6, [o(0, 2, 1), o(1, 2, 1), o(2, 2, 1), o(3, 2, 1)], 5],
  ['Tempura tower', CHAMFER, 6, [o(7, 2, 3)], 4.2],
  ['Skewer storm', STAIRS, 6, [o(8, 2, 3)], 4.4],
  ['Chirashi chain', WINDOW, 6, [o(6, 2, 3)], 4.2],
  ['Dish parade', FULL, 6, [o(6, 2, 1), o(7, 2, 1), o(8, 2, 1), o(9, 2, 1), o(0, 2, 1)], 3.8],
  ['Double feast', FULL, 6, [o(6, 2, 2), o(8, 2, 2), o(9, 2, 1)], 3.8],
  ['Master chef', FULL, 6, [o(6, 2, 2), o(7, 2, 2), o(8, 2, 1), o(9, 2, 2)], 3.8],
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

/** Frozen tiles arrive in the last two chapters and build up slowly. */
const iceFor = (id: number): number => (id < 25 ? 0 : id <= 36 ? 2 + Math.floor((id - 25) / 4) : 4 + Math.floor((id - 37) / 3))

/** Golden stars start dropping in chapter 2 and become a little more common later on. */
const luckFor = (id: number): number => (id < 13 ? 0 : id < 25 ? 0.05 : 0.07)

/** Sticky rice appears in the last chapter and starts with a single patch. */
const stickyFor = (id: number): number => (id < 41 ? 0 : 1 + Math.floor((id - 41) / 4))

export const LEVELS: LevelDef[] = SPECS.map(([name, shape, kinds, order, slack], i) => ({
  id: i + 1,
  name,
  shape,
  kinds,
  order,
  moves: Math.ceil(minLinks(order) * (slack ?? defaultSlack(order))) + 3 + Math.ceil(iceFor(i + 1) * 0.7) + stickyFor(i + 1) * 2,
  ...(iceFor(i + 1) ? { ice: iceFor(i + 1) } : {}),
  ...(luckFor(i + 1) ? { luck: luckFor(i + 1) } : {}),
  ...(stickyFor(i + 1) ? { sticky: stickyFor(i + 1) } : {}),
}))

/** Chapter boundaries (inclusive level ids), shared by the map and the hub. */
export const CHAPTER_RANGES: { title: string; sub: string; from: number; to: number }[] = [
  { title: 'Chapter 1', sub: 'Learn the kitchen', from: 1, to: 12 },
  { title: 'Chapter 2', sub: 'Mix it up', from: 13, to: 24 },
  { title: 'Chapter 3', sub: 'Service rush', from: 25, to: 36 },
  { title: 'Chapter 4', sub: 'Master chef', from: 37, to: 48 },
]

/** A line from one character and the new idea, shown when a chapter's first level is previewed. */
export const CHAPTER_INTROS: { speaker: string; line: string; idea: string }[] = [
  { speaker: 'obaa', line: 'Welcome, dear. Every great kitchen starts with one good dish.', idea: 'Drag across 3 or more matching ingredients to cook them into a dish.' },
  { speaker: 'tanaka', line: 'Lunch rush! Some orders need a bit of everything.', idea: 'Dishes made of different ingredients: link one of each, in any order.' },
  { speaker: 'ronin', line: 'The kitchen is cold tonight. Some ingredients are frozen solid.', idea: 'Clear a chain next to a frozen tile to crack its ice. A Flavor Bomb shatters it outright.' },
  { speaker: 'rx9', line: 'Final exam. Thick ice detected. Probability of success: high.', idea: 'Sticky rice spreads every few moves. Clear a chain next to it to wash it off before it takes over.' },
]

/** The last level of each chapter is a boss: a bigger order to finish the chapter. */
export const isBoss = (levelId: number) => CHAPTER_RANGES.some((c) => c.to === levelId)

export const chapterOf = (levelId: number) => CHAPTER_RANGES.findIndex((c) => levelId >= c.from && levelId <= c.to) + 1
/** A one-off level for each regular customer, unlocked once you are good friends. Its id keeps it out of the story stars. */
export interface StoryLevel extends LevelDef {
  customer: string
  title: string
  intro: string
  outro: string
}

const story = (id: number, customer: string, title: string, intro: string, outro: string, shape: string[], kinds: number, order: OrderItem[], slack: number, extra: { ice?: number; luck?: number; sticky?: number } = {}): StoryLevel => ({
  id,
  customer,
  title,
  name: title,
  intro,
  outro,
  shape,
  kinds,
  order,
  moves: Math.ceil(minLinks(order) * slack) + 3 + Math.ceil((extra.ice ?? 0) * 0.7) + (extra.sticky ?? 0) * 2,
  ...extra,
})

export const STORY_LEVELS: StoryLevel[] = [
  story(101, 'obaa', 'The pickle day', 'Today is pickling day, dear. Frozen cucumbers again... would you help an old woman?', 'These taste exactly like my mother’s. Thank you, dear.', CENTER, 5, [o(6, 2, 1), o(2, 2, 1)], 4.4, { ice: 2 }),
  story(102, 'hana', 'The birthday feast', 'It is my BIRTHDAY! Can you make a rainbow maki and some rice? Pleeease?', 'Best birthday EVER! I am telling the whole school.', FULL, 6, [o(9, 2, 1), o(0, 2, 2)], 4.2, { luck: 0.16 }),
  story(103, 'tanaka', 'The lunch deadline', 'Three dishes, one lunch break, and a very strict boss. Can you be quick?', 'Back at my desk with three minutes to spare. You are a lifesaver.', BARS, 6, [o(6, 2, 1), o(7, 2, 1), o(8, 2, 1)], 3.7, { ice: 3 }),
  story(104, 'rx9', 'Learning to feel', 'Request: help me understand joy. Method: serve two rainbow makis, even though the rice is sticky.', 'Joy detected. Warmth detected. I believe this is what humans call friendship.', DIAMOND, 6, [o(9, 2, 2)], 4.3, { ice: 2, sticky: 1 }),
  story(105, 'ronin', 'The warrior’s feast', 'My old comrades arrive at dusk. They must see a feast worthy of a samurai.', 'They wept, chef. Not from the cold. You have my sword.', BARS, 6, [o(7, 2, 2), o(8, 2, 1)], 3.9, { ice: 4 }),
  story(106, 'mochi', 'The midnight snack', 'Meow. Fish. Three plates. Do not ask why. Meow.', 'Purrrr. (Translation: you may keep your whiskers.)', CHAMFER, 6, [o(1, 2, 3)], 4.4, { luck: 0.1, ice: 2 }),
]

export const storyFor = (customerId: string): StoryLevel | undefined => STORY_LEVELS.find((s) => s.customer === customerId)
