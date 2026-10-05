import { DECOR_BASE, type DecorArt } from './iso'
import { DECOR_NEW } from './iso2'
import type { FloorItem, RugItem } from './restaurant'

/** Every floor item and rug: the original set plus the expansion. */
export const DECOR = { ...DECOR_BASE, ...DECOR_NEW } as Record<FloorItem | RugItem, DecorArt>
