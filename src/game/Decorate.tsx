import { useEffect, useRef, useState } from 'react'
import { coinSound } from './audio'
import Mascot from './Mascot'
import Room, { DecorPreview, type Ghost } from './Room'
import StoreyTabs from './StoreyTabs'
import ZoomPan from './ZoomPan'
import {
  applyStorey, canPlace, canPlaceWall, CATEGORIES, FLOORS, fixedSlots, ITEMS, itemDef, levelOf, moveItem, moveWall, placeItem, placeWall, sizeOf, storeyView, type StoreyId,
  rarityOf, removeItem, sellValue, SET_TIERS, setBonusRate, setProgress, SETS, WALLS, withPeak,
  type Category, type FloorId, type ItemType, type Restaurant, type WallId, type WallSide,
} from './restaurant'

export type DecorTab = Category | 'floors' | 'paint'

interface Props {
  r: Restaurant
  setR: (r: Restaurant) => void
  coins: number
  spend: (n: number) => boolean
  earn: (n: number) => void
  onDone: () => void
  /** Called after a purchase is placed (used by the tutorial). */
  onBought?: () => void
  /** Which shop tab to open first. */
  initialTab?: DecorTab
  storey: StoreyId
  onStorey: (id: StoreyId) => void
  /** The player tapped a floor that is not built yet. */
  onBuild: () => void
}

type WallGhost = { type: ItemType; side: WallSide; slot: number; ignoreId?: number }
type Placing = { ghost?: Ghost; wall?: WallGhost; shop: boolean }

const FLOOR_SWATCH: Record<FloorId, string> = {
  wood: 'linear-gradient(135deg, #ebc790, #d9b078)',
  tatami: 'linear-gradient(135deg, #b9d17a, #98b45c)',
  stone: 'linear-gradient(135deg, #9998b2, #7b7a96)',
  checker: 'conic-gradient(#d9473f 25%, #fff0d8 0 50%, #d9473f 0 75%, #fff0d8 0) 0 0 / 50% 50%',
  deck: 'repeating-linear-gradient(0deg, #b8956a 0 7px, #8a6a46 7px 9px)',
  grass: 'linear-gradient(135deg, #7fcf5a, #5fb046)',
}
const WALL_SWATCH: Record<WallId, string> = {
  cream: 'linear-gradient(135deg, #f6e8cf, #e8d5b2)',
  indigo: 'linear-gradient(135deg, #454aa6, #343887)',
  matcha: 'linear-gradient(135deg, #a9d083, #8fb86b)',
  sakura: 'linear-gradient(135deg, #ffd6e2, #f3b8cb)',
}
const SET_COLOR: Record<string, string> = { izakaya: '#ffb347', sushibar: '#7fe6ff', zen: '#6dffc0', shrine: '#ff7a8a', neon: '#d29bff' }

const Coin = () => <i className="coinicon" />

export default function Decorate({ r: root, setR: setRoot, coins, spend, earn, onDone, onBought, initialTab = 'seating', storey, onStorey, onBuild }: Props) {
  const r = storeyView(root, storey)
  const setR = (next: Restaurant) => setRoot(applyStorey(root, storey, next))
  const [tab, setTab] = useState<DecorTab>(initialTab)
  const [placing, setPlacing] = useState<Placing | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const level = levelOf(root)
  const grid = sizeOf(root, storey)
  const rooftop = storey === 'rooftop'
  const selected = selectedId ? r.items.find((p) => p.id === selectedId) : null
  const sets = setProgress(root)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const say = (text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  /** Apply a new restaurant and celebrate if it crossed a level. */
  const commit = (next: Restaurant) => {
    const before = levelOf(root)
    const grown = withPeak(applyStorey(root, storey, next))
    const after = grown.peak ?? 1
    setRoot(grown)
    if (after > before) setLevelUp(after)
  }

  const firstFree = (type: ItemType): [number, number] | null => {
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (canPlace(r, type, x, y, grid)) return [x, y]
    return null
  }

  const firstFreeWall = (type: ItemType): { side: WallSide; slot: number } | null => {
    for (const side of ['R', 'L'] as WallSide[]) {
      for (let slot = 0; slot < grid; slot++) if (canPlaceWall(r, type, side, slot, grid)) return { side, slot }
    }
    return null
  }

  const startShop = (type: ItemType) => {
    const def = itemDef(type)
    if (def.unlock > level) return say(`Unlocks at restaurant level ${def.unlock}`)
    if (coins < def.price) return say(`You need ${def.price - coins} more coins`)
    setSelectedId(null)
    if (def.layer === 'wall') {
      const spot = firstFreeWall(type)
      if (!spot) return say('The walls are full. Sell something or level up!')
      return setPlacing({ wall: { type, ...spot }, shop: true })
    }
    const spot = firstFree(type)
    if (!spot) return say(def.layer === 'rug' ? 'No room for a rug there' : 'No room left. Sell something or level up!')
    setPlacing({ ghost: { type, gx: spot[0], gy: spot[1] }, shop: true })
  }

  const confirm = () => {
    if (!placing) return
    if (placing.ghost) {
      const g = placing.ghost
      if (!canPlace(r, g.type, g.gx, g.gy, grid, g.ignoreId, g.flip)) return say('Pick a free tile')
      if (placing.shop) {
        if (!spend(itemDef(g.type).price)) return say('Not enough coins')
        coinSound(3)
        commit(placeItem(r, g.type, g.gx, g.gy, g.flip))
        onBought?.()
      } else if (g.ignoreId) {
        commit(moveItem(r, g.ignoreId, g.gx, g.gy, g.flip))
      }
    } else if (placing.wall) {
      const w = placing.wall
      if (!canPlaceWall(r, w.type, w.side, w.slot, grid, w.ignoreId)) return say('Pick a free spot on the wall')
      if (placing.shop) {
        if (!spend(itemDef(w.type).price)) return say('Not enough coins')
        coinSound(3)
        commit(placeWall(r, w.type, w.side, w.slot))
        onBought?.()
      } else if (w.ignoreId) {
        commit(moveWall(r, w.ignoreId, w.side, w.slot))
      }
    }
    setPlacing(null)
  }

  const onTile = (gx: number, gy: number) => {
    if (!placing) return setSelectedId(null)
    if (!placing.ghost) return
    const g = placing.ghost
    if (g.gx === gx && g.gy === gy && canPlace(r, g.type, gx, gy, grid, g.ignoreId, g.flip)) return confirm()
    setPlacing({ ...placing, ghost: { ...g, gx, gy } })
  }

  const onWall = (side: WallSide, slot: number) => {
    if (!placing?.wall) return
    const w = placing.wall
    if (w.side === side && w.slot === slot && canPlaceWall(r, w.type, side, slot, grid, w.ignoreId)) return confirm()
    setPlacing({ ...placing, wall: { ...w, side, slot } })
  }

  const startMove = () => {
    if (!selected) return
    const def = itemDef(selected.type)
    if (def.layer === 'wall') {
      setPlacing({ wall: { type: selected.type, side: selected.wall ?? 'R', slot: selected.gx, ignoreId: selected.id }, shop: false })
    } else {
      setPlacing({ ghost: { type: selected.type, gx: selected.gx, gy: selected.gy, ignoreId: selected.id, flip: selected.flip }, shop: false })
    }
  }

  const rotateSelected = () => {
    if (!selected) return
    const flip = !selected.flip
    if (!canPlace(r, selected.type, selected.gx, selected.gy, grid, selected.id, flip)) return say('No room to rotate here')
    setR(moveItem(r, selected.id, selected.gx, selected.gy, flip))
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

  const placingType = placing?.ghost?.type ?? placing?.wall?.type
  const cost = placing?.shop && placingType ? itemDef(placingType).price : 0
  const okSpot = placing?.ghost
    ? canPlace(r, placing.ghost.type, placing.ghost.gx, placing.ghost.gy, grid, placing.ghost.ignoreId, placing.ghost.flip)
    : placing?.wall
      ? canPlaceWall(r, placing.wall.type, placing.wall.side, placing.wall.slot, grid, placing.wall.ignoreId)
      : false
  const isWallPlacing = !!placing?.wall
  const canRotate = !!placing?.ghost && itemDef(placing.ghost.type).layer !== 'wall'

  /** Does buying this item complete the next collection tier for its set? */
  const completesTier = (type: ItemType) => {
    const set = itemDef(type).set
    const count = sets.find((s) => s.set === set)?.count ?? 0
    return SET_TIERS.some((t) => count + 1 === t.count)
  }

  const tabs: { id: DecorTab; name: string }[] = [...CATEGORIES.filter((c) => !(rooftop && c.id === 'wall')), { id: 'floors', name: 'Floors' }, ...(rooftop ? [] : [{ id: 'paint' as DecorTab, name: 'Paint' }])]
  const shown = ITEMS.filter((i) => i.category === tab)
  void fixedSlots

  return (
    <main className="screen decorate">
      <header className="bar">
        <button className="btn ghost" data-coach="done" onClick={onDone}>Done</button>
        <h2>Decorate</h2>
        <span className="coin"><Coin />{coins}</span>
      </header>

      <StoreyTabs r={root} active={storey} onPick={(id) => { setPlacing(null); setSelectedId(null); onStorey(id); setTab(id === 'rooftop' && tab === 'wall' ? 'seating' : tab) }} onLocked={onBuild} />

      <div className="stage">
        <ZoomPan resetKey={storey}>
        <Room
          storey={storey}
          r={r}
          grid={grid}
          placing={placing?.ghost ?? null}
          wallGhost={placing?.wall ?? null}
          selectedId={selectedId}
          onTile={onTile}
          onWall={onWall}
          onItem={(id) => setSelectedId(id)}
          onHover={(gx, gy) => placing?.ghost && setPlacing({ ...placing, ghost: { ...placing.ghost, gx, gy } })}
        />
        </ZoomPan>
        {toast && <p className="toast" key={toast}>{toast}</p>}
      </div>

      <section className="sheet" aria-label="Decorate controls">
        {placing && placingType ? (
          <div className="placebar">
            <div>
              <b>{itemDef(placingType).name}</b>
              <small>{okSpot ? (isWallPlacing ? 'Tap the same spot again, or press Place' : 'Tap the tile again, or press Place') : isWallPlacing ? 'Tap a free spot on a wall' : 'Tap a free tile'}</small>
            </div>
            {canRotate && (
              <button className="btn" onClick={() => placing.ghost && setPlacing({ ...placing, ghost: { ...placing.ghost, flip: !placing.ghost.flip } })}>Rotate</button>
            )}
            <button className="btn ghost" onClick={() => setPlacing(null)}>Cancel</button>
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
            {itemDef(selected.type).layer !== 'wall' && <button className="btn" onClick={rotateSelected}>Rotate</button>}
            <button className="btn" onClick={sell}>Sell <Coin />{sellValue(selected.type)}</button>
            <button className="btn ghost" onClick={() => setSelectedId(null)}>Close</button>
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist">
              {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
            {tab !== 'floors' && tab !== 'paint' && (
              <div className="setrow" aria-label="Collections">
                {SETS.map((s) => {
                  const p = sets.find((x) => x.set === s.id)!
                  return (
                    <span key={s.id} className={`setpill${p.rate > 0 ? ' on' : ''}`} style={{ ['--sc' as string]: SET_COLOR[s.id] }} title={s.blurb}>
                      <i />{s.name} {p.count}{p.next ? `/${p.next}` : ''}{p.rate > 0 && <b>+{Math.round(setBonusRate(p.count) * 100)}%</b>}
                    </span>
                  )
                })}
                <span className="rlv">Level {level}</span>
              </div>
            )}
            <div className="cards">
              {tab !== 'floors' && tab !== 'paint' &&
                shown.map((def) => {
                  const locked = def.unlock > level
                  const rar = rarityOf(def.price)
                  return (
                    <button
                      key={def.type}
                      data-coach={`card-${def.type}`}
                      className={`shopcard r-${rar}${locked ? ' locked' : ''}${coins < def.price && !locked ? ' poor' : ''}`}
                      onClick={() => startShop(def.type)}
                    >
                      <i className="setdot" style={{ background: SET_COLOR[def.set] }} aria-hidden />
                      <DecorPreview type={def.type} size={78} />
                      <span className="nm">{def.name}</span>
                      <span className="pr">{locked ? `Level ${def.unlock}` : <><Coin />{def.price}</>}</span>
                      {!locked && completesTier(def.type) && <em className="tierup">Set bonus!</em>}
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
              {tab === 'paint' &&
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
              Your restaurant is getting famous. New expansions and upgrades are ready in the Build menu.
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
