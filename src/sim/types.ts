export interface Tile {
  id: number
  kind: number
  tier: number
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
}

export interface MergeEvent {
  removed: number[]
  resultId: number
  toCell: number
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
