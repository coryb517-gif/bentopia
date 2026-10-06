// Placeholder art: emoji per ingredient chain. Tier 0 = raw, 1 = crafted, 2 = dish.
export interface Chain {
  names: [string, string, string]
  emoji: [string, string, string]
}

export const CHAINS: Chain[] = [
  { names: ['Rice', 'Onigiri', 'Bento box'], emoji: ['🍚', '🍙', '🍱'] },
  { names: ['Fish', 'Nigiri', 'Sashimi plate'], emoji: ['🐟', '🍣', '🍥'] },
  { names: ['Cucumber', 'Kappa maki', 'Hot pot'], emoji: ['🥒', '🍙', '🍲'] },
  { names: ['Egg', 'Tamago', 'Ramen'], emoji: ['🥚', '🍳', '🍜'] },
  { names: ['Shrimp', 'Tempura', 'Katsu curry'], emoji: ['🦐', '🍤', '🍛'] },
  { names: ['Corn', 'Skewer', 'Rice cracker'], emoji: ['🌽', '🍢', '🍘'] },
  // Kinds 6+ are mixed dishes: only tier 2 exists.
  { names: ['', '', 'Chirashi bowl'], emoji: ['', '', '🍱'] },
  { names: ['', '', 'Tempura roll'], emoji: ['', '', '🍣'] },
  { names: ['', '', 'Yakitori feast'], emoji: ['', '', '🍢'] },
  { names: ['', '', 'Rainbow maki'], emoji: ['', '', '🍣'] },
  // Kind 10 is the Flavor Bomb.
  { names: ['Flavor Bomb', '', ''], emoji: ['💣', '', ''] },
]

export const MAX_TIER = 2

/** First kind id that is a mixed dish rather than a raw ingredient chain. */
export const FIRST_MIXED_KIND = 6

/** The special tile left behind by a chain of five or more. */
export const BOMB_KIND = 10

export interface ItemRef {
  kind: number
  tier: number
}

/** Link one of each input (any order, adjacent) to make the output. */
export interface Recipe {
  out: ItemRef
  inputs: ItemRef[]
}

export const RECIPES: Recipe[] = [
  { out: { kind: 6, tier: 2 }, inputs: [{ kind: 0, tier: 1 }, { kind: 1, tier: 1 }, { kind: 3, tier: 1 }] },
  { out: { kind: 7, tier: 2 }, inputs: [{ kind: 2, tier: 1 }, { kind: 4, tier: 1 }, { kind: 0, tier: 1 }] },
  { out: { kind: 8, tier: 2 }, inputs: [{ kind: 5, tier: 1 }, { kind: 3, tier: 1 }, { kind: 4, tier: 1 }] },
  { out: { kind: 9, tier: 2 }, inputs: [{ kind: 2, tier: 1 }, { kind: 1, tier: 1 }, { kind: 5, tier: 1 }] },
]

export const recipeFor = (kind: number, tier: number) => RECIPES.find((r) => r.out.kind === kind && r.out.tier === tier)
