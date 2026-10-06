import { useEffect, useRef, useState } from 'react'
import { coinSound } from './audio'
import Room from './Room'
import Exterior from './Exterior'
import {
  allItems, BUILD, buildStorey, DEFAULT_NAME, NAME_WORDS, restaurantName, buyUpgrade, decorScore, expandStorey, hasStorey, itemDef, levelOf, nextExpansion, nextUpgrade, seatTotal, sizeOf,
  STOREY_IDS, STOREY_NAMES, storeyOf, storeyView, tipCapHours, tipsPerHour, UPGRADES, upgradeLevel, type Restaurant, type StoreyId, type UpgradeId,
} from './restaurant'

interface Props {
  r: Restaurant
  setR: (r: Restaurant) => void
  coins: number
  spend: (n: number) => boolean
  onBack: () => void
  /** Jump to decorating a floor. */
  onGoto: (id: StoreyId) => void
}

const Coin = () => <i className="coinicon" />

const BLURB: Record<StoreyId, string> = {
  ground: 'Your main dining room, right on the street.',
  upstairs: BUILD.upstairs.blurb,
  rooftop: BUILD.rooftop.blurb,
}

export default function Build({ r, setR, coins, spend, onBack, onGoto }: Props) {
  const level = levelOf(r)
  const score = decorScore(r)
  const seats = seatTotal(r)
  const menu = upgradeLevel(r, 'menu')
  const [toast, setToast] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const say = (t: string) => {
    clearTimeout(timer.current)
    setToast(t)
    timer.current = setTimeout(() => setToast(''), 2200)
  }

  const buy = (cost: number, need: number, apply: () => void) => {
    if (level < need) return say(`Reach restaurant level ${need} first`)
    if (!spend(cost)) return say(`You need ${cost - coins} more coins`)
    coinSound(4)
    apply()
  }

  return (
    <main className="screen build">
      <header className="bar">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <h2>Build</h2>
        <span className="coin"><Coin />{coins}</span>
      </header>
      {toast && <p className="toast fixed" key={toast}>{toast}</p>}

      <div className="buildhero" aria-hidden><Exterior r={r} /></div>

      <section className="statrow" aria-label="Restaurant stats">
        <div><b>{level}</b><small>Level</small></div>
        <div><b>{score}</b><small>Decor</small></div>
        <div><b>{seats}</b><small>Seats</small></div>
        <div><b>{Math.round(tipsPerHour(score, seats, menu))}</b><small>Tips / hr</small></div>
      </section>

      <h3 className="sect">Your sign</h3>
      <div className="upgrade">
        <p className="signpreview">{restaurantName(r)[0]}<small>{restaurantName(r)[1].toUpperCase()}</small></p>
        <div className="namepick">
          {([0, 1, 2] as const).map((slot) => (
            <select
              key={slot}
              aria-label={['Adjective', 'Food', 'Place'][slot]}
              value={(r.name ?? DEFAULT_NAME)[slot]}
              onChange={(e) => {
                const next: [number, number, number] = [...(r.name ?? DEFAULT_NAME)] as [number, number, number]
                next[slot] = Number(e.target.value)
                setR({ ...r, name: next })
              }}
            >
              {NAME_WORDS[slot].map((w, i) => <option key={w} value={i}>{w}</option>)}
            </select>
          ))}
        </div>
      </div>

      <h3 className="sect">Your building</h3>
      <div className="storeycards">
        {STOREY_IDS.map((id) => {
          const built = hasStorey(r, id)
          const s = storeyOf(r, id)
          const ex = built ? nextExpansion(r, id) : null
          const b = id === 'ground' ? null : BUILD[id]
          const seatsHere = s ? s.items.reduce((n, p) => n + itemDef(p.type).seats, 0) : 0
          return (
            <article key={id} className={`storeycard${built ? '' : ' unbuilt'}`}>
              <div className="thumb" aria-hidden>
                {built ? <Room r={storeyView(r, id)} grid={sizeOf(r, id)} storey={id} live={false} /> : <svg className="plot" viewBox="-70 -10 140 90" aria-hidden><polygon points="0,10 64,42 0,74 -64,42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="6 5" strokeLinejoin="round" /><path d="M-3 36h6M0 33v6" stroke="#ffd45e" strokeWidth="3" strokeLinecap="round" /><path d="M30 20v-26" stroke="#c99a5c" strokeWidth="3" strokeLinecap="round" /><rect x="14" y="-12" width="34" height="14" rx="3" fill="#ffd45e" stroke="#2a0f2e" strokeWidth="2" /><path d="M20 -5h22" stroke="#2a0f2e" strokeWidth="2" strokeLinecap="round" /></svg>}
              </div>
              <div className="sc-body">
                <h4>{STOREY_NAMES[id]}</h4>
                <p>{BLURB[id]}</p>
                {built ? (
                  <p className="meta">{sizeOf(r, id)} × {sizeOf(r, id)} tiles · {s!.items.length} items · {seatsHere} seats</p>
                ) : (
                  <p className="meta">Needs restaurant level {b!.level}</p>
                )}
                <div className="sc-actions">
                  {built ? (
                    <>
                      <button className="btn" onClick={() => onGoto(id)}>Decorate</button>
                      {ex ? (
                        <button
                          className={`btn primary${level < ex.level ? ' locked' : ''}`}
                          onClick={() => buy(ex.cost, ex.level, () => setR(expandStorey(r, id)))}
                        >
                          {level < ex.level ? `Lv ${ex.level}` : <>Expand to {ex.size}×{ex.size} <Coin />{ex.cost}</>}
                        </button>
                      ) : (
                        <span className="maxed">Fully expanded</span>
                      )}
                    </>
                  ) : (
                    <button className={`btn primary${level < b!.level ? ' locked' : ''}`} onClick={() => buy(b!.cost, b!.level, () => { setR(buildStorey(r, id as 'upstairs' | 'rooftop')); onGoto(id) })}>
                      {level < b!.level ? `Lv ${b!.level}` : <>Build <Coin />{b!.cost}</>}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <h3 className="sect">Upgrades</h3>
      <div className="upgrades">
        {(Object.keys(UPGRADES) as UpgradeId[]).map((k) => {
          const u = UPGRADES[k]
          const lvl = upgradeLevel(r, k)
          const next = nextUpgrade(r, k)
          return (
            <article key={k} className="upgrade">
              <div className="up-head">
                <h4>{u.name}</h4>
                <span className="pips" aria-label={`Level ${lvl} of ${u.steps.length}`}>
                  {u.steps.map((_, i) => <i key={i} className={i < lvl ? 'on' : ''} />)}
                </span>
              </div>
              <p>{u.blurb}</p>
              <p className="meta">
                {k === 'register' ? `Jar holds ${tipCapHours(lvl)} hours of tips` : `${lvl === 0 ? 'Standard tips' : u.steps[lvl - 1].label}`}
                {next && <> · next: {next.label}</>}
              </p>
              {next ? (
                <button className={`btn primary${level < next.level ? ' locked' : ''}`} onClick={() => buy(next.cost, next.level, () => setR(buyUpgrade(r, k)))}>
                  {level < next.level ? `Lv ${next.level}` : <>Upgrade <Coin />{next.cost}</>}
                </button>
              ) : (
                <span className="maxed">Maxed out</span>
              )}
            </article>
          )
        })}
      </div>
      <p className="fine centered">{allItems(r).length} items across {STOREY_IDS.filter((id) => hasStorey(r, id)).length} floors.</p>
    </main>
  )
}
