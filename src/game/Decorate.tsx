import { useEffect, useRef, useState } from 'react'
import { coinSound } from './audio'
import Mascot from './Mascot'
import Room, { DecorPreview, type Ghost } from './Room'
import {
  canPlace, FLOORS, gridSize, ITEMS, itemDef, levelOf, moveItem, placeItem, removeItem, sellValue, withPeak,
  WALLS, type FloorId, type ItemType, type Restaurant, type WallId,
} from './restaurant'

interface Props {
  r: Restaurant
  setR: (r: Restaurant) => void
  coins: number
  spend: (n: number) => boolean
  earn: (n: number) => void
  onDone: () => void
  /** Called after a purchase is placed (used by the tutorial). */
  onBought?: () => void
}

type Tab = 'furniture' | 'floors' | 'walls'
type Placing = { ghost: Ghost; shop: boolean }

const FLOOR_SWATCH: Record<FloorId, string> = {
  wood: 'linear-gradient(135deg, #ebc790, #d9b078)',
  tatami: 'linear-gradient(135deg, #b9d17a, #98b45c)',
  stone: 'linear-gradient(135deg, #9998b2, #7b7a96)',
  checker: 'conic-gradient(#d9473f 25%, #fff0d8 0 50%, #d9473f 0 75%, #fff0d8 0) 0 0 / 50% 50%',
}
const WALL_SWATCH: Record<WallId, string> = {
  cream: 'linear-gradient(135deg, #f6e8cf, #e8d5b2)',
  indigo: 'linear-gradient(135deg, #454aa6, #343887)',
  matcha: 'linear-gradient(135deg, #a9d083, #8fb86b)',
  sakura: 'linear-gradient(135deg, #ffd6e2, #f3b8cb)',
}

const Coin = () => <i className="coinicon" />

export default function Decorate({ r, setR, coins, spend, earn, onDone, onBought }: Props) {
  const [tab, setTab] = useState<Tab>('furniture')
  const [placing, setPlacing] = useState<Placing | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const level = levelOf(r)
  const grid = gridSize(level)
  const selected = selectedId ? r.items.find((p) => p.id === selectedId) : null

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const say = (text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  /** Apply a new restaurant and celebrate if it crossed a level. */
  const commit = (next: Restaurant) => {
    const before = levelOf(r)
    const grown = withPeak(next)
    const after = grown.peak ?? 1
    setR(grown)
    if (after > before) setLevelUp(after)
  }

  const firstFree = (type: ItemType): [number, number] | null => {
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (canPlace(r, type, x, y, grid)) return [x, y]
    return null
  }

  const startShop = (type: ItemType) => {
    const def = itemDef(type)
    if (def.unlock > level) return say(`Unlocks at restaurant level ${def.unlock}`)
    if (coins < def.price) return say(`You need ${def.price - coins} more coins`)
    const spot = firstFree(type)
    if (!spot) return say('No room left. Sell something or level up!')
    setSelectedId(null)
    setPlacing({ ghost: { type, gx: spot[0], gy: spot[1] }, shop: true })
  }

  const confirm = () => {
    if (!placing) return
    const g = placing.ghost
    if (!canPlace(r, g.type, g.gx, g.gy, grid, g.ignoreId)) return say('Pick a free tile')
    if (placing.shop) {
      if (!spend(itemDef(g.type).price)) return say('Not enough coins')
      coinSound(3)
      commit(placeItem(r, g.type, g.gx, g.gy))
      onBought?.()
    } else if (g.ignoreId) {
      commit(moveItem(r, g.ignoreId, g.gx, g.gy))
    }
    setPlacing(null)
  }

  const onTile = (gx: number, gy: number) => {
    if (!placing) return setSelectedId(null)
    const g = placing.ghost
    if (g.gx === gx && g.gy === gy && canPlace(r, g.type, gx, gy, grid, g.ignoreId)) return confirm()
    setPlacing({ ...placing, ghost: { ...g, gx, gy } })
  }

  const startMove = () => {
    if (!selected) return
    setPlacing({ ghost: { type: selected.type, gx: selected.gx, gy: selected.gy, ignoreId: selected.id }, shop: false })
  }

  const sell = () => {
    if (!selected) return
    const gain = sellValue(selected.type)
    earn(gain)
    coinSound(1)
    setR(removeItem(r, selected.id))
    setSelectedId(null)
    say(`Sold for ${gain} coins`)
  }

  const pickTheme = (kind: 'floor' | 'wall', id: FloorId | WallId, price: number) => {
    const owned = kind === 'floor' ? r.ownedFloors.includes(id as FloorId) : r.ownedWalls.includes(id as WallId)
    if (!owned) {
      if (!spend(price)) return say(`You need ${price - coins} more coins`)
      coinSound(4)
    }
    const next: Restaurant =
      kind === 'floor'
        ? { ...r, floor: id as FloorId, ownedFloors: r.ownedFloors.includes(id as FloorId) ? r.ownedFloors : [...r.ownedFloors, id as FloorId] }
        : { ...r, wall: id as WallId, ownedWalls: r.ownedWalls.includes(id as WallId) ? r.ownedWalls : [...r.ownedWalls, id as WallId] }
    commit(next)
  }

  const cost = placing?.shop ? itemDef(placing.ghost.type).price : 0
  const okSpot = placing ? canPlace(r, placing.ghost.type, placing.ghost.gx, placing.ghost.gy, grid, placing.ghost.ignoreId) : false

  return (
    <main className="screen decorate">
      <header className="bar">
        <button className="btn ghost" data-coach="done" onClick={onDone}>Done</button>
        <h2>Decorate</h2>
        <span className="coin"><Coin />{coins}</span>
      </header>

      <div className="stage">
        <Room
          r={r}
          grid={grid}
          placing={placing?.ghost ?? null}
          selectedId={selectedId}
          onTile={onTile}
          onItem={(id) => setSelectedId(id)}
          onHover={(gx, gy) => placing && setPlacing({ ...placing, ghost: { ...placing.ghost, gx, gy } })}
        />
        {toast && <p className="toast" key={toast}>{toast}</p>}
      </div>

      <section className="sheet" aria-label="Decorate controls">
        {placing ? (
          <div className="placebar">
            <div>
              <b>{itemDef(placing.ghost.type).name}</b>
              <small>{okSpot ? 'Tap the tile again, or press Place' : 'Tap a free tile'}</small>
            </div>
            <button className="btn" onClick={() => setPlacing(null)}>Cancel</button>
            <button className="btn primary" data-coach="place" disabled={!okSpot} onClick={confirm}>
              {placing.shop ? <>Place <Coin />{cost}</> : 'Move here'}
            </button>
          </div>
        ) : selected ? (
          <div className="placebar">
            <div>
              <b>{itemDef(selected.type).name}</b>
              <small>{itemDef(selected.type).blurb}</small>
            </div>
            <button className="btn" onClick={startMove}>Move</button>
            <button className="btn" onClick={sell}>Sell <Coin />{sellValue(selected.type)}</button>
            <button className="btn ghost" onClick={() => setSelectedId(null)}>Close</button>
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist">
              {(['furniture', 'floors', 'walls'] as Tab[]).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
                  {t === 'furniture' ? 'Furniture' : t === 'floors' ? 'Floors' : 'Walls'}
                </button>
              ))}
              <span className="rlv">Level {level}</span>
            </div>
            <div className="cards">
              {tab === 'furniture' &&
                ITEMS.map((def) => {
                  const locked = def.unlock > level
                  return (
                    <button key={def.type} data-coach={`card-${def.type}`} className={`shopcard${locked ? ' locked' : ''}${coins < def.price && !locked ? ' poor' : ''}`} onClick={() => startShop(def.type)}>
                      <DecorPreview type={def.type} size={78} />
                      <span className="nm">{def.name}</span>
                      <span className="pr">{locked ? `Level ${def.unlock}` : <><Coin />{def.price}</>}</span>
                      {locked && <i className="lock" aria-hidden>🔒</i>}
                    </button>
                  )
                })}
              {tab === 'floors' &&
                FLOORS.map((f) => (
                  <button key={f.id} className={`shopcard theme${r.floor === f.id ? ' equipped' : ''}`} onClick={() => pickTheme('floor', f.id, f.price)}>
                    <span className="swatch" style={{ background: FLOOR_SWATCH[f.id] }} />
                    <span className="nm">{f.name}</span>
                    <span className="pr">{r.floor === f.id ? 'Equipped' : r.ownedFloors.includes(f.id) ? 'Use' : <><Coin />{f.price}</>}</span>
                  </button>
                ))}
              {tab === 'walls' &&
                WALLS.map((w) => (
                  <button key={w.id} className={`shopcard theme${r.wall === w.id ? ' equipped' : ''}`} onClick={() => pickTheme('wall', w.id, w.price)}>
                    <span className="swatch" style={{ background: WALL_SWATCH[w.id] }} />
                    <span className="nm">{w.name}</span>
                    <span className="pr">{r.wall === w.id ? 'Equipped' : r.ownedWalls.includes(w.id) ? 'Use' : <><Coin />{w.price}</>}</span>
                  </button>
                ))}
            </div>
          </>
        )}
      </section>

      {levelUp && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="card">
            <Mascot mood="wow" size={120} />
            <h2>Level {levelUp}!</h2>
            <p>
              Your restaurant is getting famous.
              {gridSize(levelUp) > gridSize(levelUp - 1) ? ` The room grew to ${gridSize(levelUp)} by ${gridSize(levelUp)} tiles.` : ''}
            </p>
            {ITEMS.some((i) => i.unlock === levelUp) && (
              <p className="newitems">
                New in the shop: {ITEMS.filter((i) => i.unlock === levelUp).map((i) => i.name).join(', ')}
              </p>
            )}
            <div className="actions">
              <button className="btn primary" onClick={() => setLevelUp(null)}>Keep decorating</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
