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
]

export const MAX_TIER = 2
