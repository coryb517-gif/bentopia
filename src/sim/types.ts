export interface Tile {
  id: number
  kind: number
  tier: number
  /** Layers of ice: a frozen tile cannot be linked until it thaws. */
  ice?: number
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
}

export interface MergeEvent {
  removed: number[]
  resultId: number
  toCell: number
  /** Set when the chain also left a Flavor Bomb behind. */
  bombId?: number
  /** Frozen tiles that lost a layer of ice this move. */
  thawed?: number[]
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
  stars: 0 | 1 | 2 | 3
  last: MergeEvent | null
}
