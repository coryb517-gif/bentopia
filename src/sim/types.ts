export interface Tile {
  id: number
  kind: number
  tier: number
  /** Layers of ice: a frozen tile cannot be linked until it thaws. */
  ice?: number
  /** Sticky rice: frozen like ice, but it spreads to a neighbour every few moves until it is cleared. */
  sticky?: boolean
  /** A golden star: link it for a bonus move. */
  lucky?: boolean
}

export interface OrderItem {
  kind: number
  tier: number
  count: number
}

export interface LevelDef {
  id: number
  name: string
  /** 8 strings of 8 chars. '#' is a blocked cell. */
  shape: string[]
  kinds: number
  moves: number
  order: OrderItem[]
  /** How many raw tiles start frozen. */
  ice?: number
  /** Chance (0 to 1) that a freshly dropped raw tile carries a golden star. */
  luck?: number
  /** How many raw tiles start covered in spreading sticky rice. */
  sticky?: number
}

export interface MergeEvent {
  removed: number[]
  resultId: number
  toCell: number
  /** Set when the chain also left a Flavor Bomb behind. */
  bombId?: number
  /** Frozen tiles that lost a layer of ice this move. */
  thawed?: number[]
  /** Raw tiles that sticky rice just spread onto. */
  spread?: number[]
  /** Set when a very long chain also left a Chef's Special behind. */
  wildId?: number
  /** Golden-star tiles in the chain: each one paid a bonus move. */
  lucky?: number
}

export type Status = 'playing' | 'won' | 'lost'

export interface GameState {
  level: LevelDef
  cells: (Tile | null)[]
  blocked: boolean[]
  movesLeft: number
  progress: number[]
  rng: number
  nextId: number
  status: Status
  /** Moves since sticky rice was last cleared; at three it spreads. */
  spread?: number
  stars: 0 | 1 | 2 | 3
  last: MergeEvent | null
}
