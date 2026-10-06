import {
  BUILD, buildStorey, buyUpgrade, decorScore, DEFAULT_NAME, expandStorey, hasStorey, itemDef, levelOf, NAME_WORDS, nextExpansion, nextUpgrade, restaurantName, seatTotal, sizeOf,
  STOREY_IDS, STOREY_NAMES, storeyOf, tipCapHours, tipsPerHour, UPGRADES, upgradeLevel, type Restaurant, type StoreyId, type UpgradeId,
} from './restaurant'
import { coinSound } from './audio'

interface Props {
  r: Restaurant
  setR: (r: Restaurant) => void
  coins: number
  spend: (n: number) => boolean
  say: (text: string) => void
  /** Floor currently on screen. */
  storey: StoreyId
  /** Show a floor in the room view. */
  onShow: (id: StoreyId) => void
}

const Coin = () => <i className="coinicon" />

const BLURB: Record<StoreyId, string> = {
  ground: 'Your main dining room, right on the street.',
  upstairs: BUILD.upstairs.blurb,
  rooftop: BUILD.rooftop.blurb,
}

/** Everything about the building itself, shown under the room so you watch it change as you buy. */
export default function BuildPanel({ r, setR, coins, spend, say, storey, onShow }: Props) {
  const level = levelOf(r)
  const score = decorScore(r)
  const seats = seatTotal(r)
  const menu = upgradeLevel(r, 'menu')

  const buy = (cost: number, need: number, apply: () => void) => {
    if (level < need) return say(`Reach restaurant level ${need} first`)
    if (!spend(cost)) return say(`You need ${cost - coins} more coins`)
    coinSound(4)
    apply()
  }

  return (
    <div className="buildpanel">
      <section className="statrow" aria-label="Restaurant stats">
        <div><b>{level}</b><small>Level</small></div>
        <div><b>{score}</b><small>Decor</small></div>
        <div><b>{seats}</b><small>Seats</small></div>
        <div><b>{Math.round(tipsPerHour(score, seats, menu))}</b><small>Tips / hr</small></div>
      </section>

      <h3 className="sect">Floors</h3>
      <div className="floorrows">
        {STOREY_IDS.map((id) => {
          const built = hasStorey(r, id)
          const s = storeyOf(r, id)
          const ex = built ? nextExpansion(r, id) : null
          const b = id === 'ground' ? null : BUILD[id]
          const seatsHere = s ? s.items.reduce((n, p) => n + itemDef(p.type).seats, 0) : 0
          return (
            <article key={id} className={`floorrow${storey === id && built ? ' here' : ''}${built ? '' : ' unbuilt'}`}>
              <button className="frmain" onClick={() => built && onShow(id)} disabled={!built} aria-label={built ? `Show ${STOREY_NAMES[id]}` : STOREY_NAMES[id]}>
                <b>{STOREY_NAMES[id]}</b>
                <small>{built ? `${sizeOf(r, id)}×${sizeOf(r, id)} tiles · ${seatsHere} seats` : BLURB[id]}</small>
              </button>
              {built ? (
                ex ? (
                  <button className={`btn primary${level < ex.level ? ' locked' : ''}`} onClick={() => { onShow(id); buy(ex.cost, ex.level, () => setR(expandStorey(r, id))) }}>
                    {level < ex.level ? `Lv ${ex.level}` : <>Grow to {ex.size}×{ex.size} <Coin />{ex.cost}</>}
                  </button>
                ) : (
                  <span className="maxed">Fully grown</span>
                )
              ) : (
                <button className={`btn primary${level < b!.level ? ' locked' : ''}`} onClick={() => buy(b!.cost, b!.level, () => { setR(buildStorey(r, id as 'upstairs' | 'rooftop')); onShow(id) })}>
                  {level < b!.level ? `Lv ${b!.level}` : <>Build <Coin />{b!.cost}</>}
                </button>
              )}
            </article>
          )
        })}
      </div>

      <h3 className="sect">Upgrades</h3>
      <div className="floorrows">
        {(Object.keys(UPGRADES) as UpgradeId[]).map((k) => {
          const u = UPGRADES[k]
          const lvl = upgradeLevel(r, k)
          const next = nextUpgrade(r, k)
          return (
            <article key={k} className="floorrow">
              <div className="frmain">
                <b>{u.name} <span className="pips" aria-label={`Level ${lvl} of ${u.steps.length}`}>{u.steps.map((_, i) => <i key={i} className={i < lvl ? 'on' : ''} />)}</span></b>
                <small>{k === 'register' ? `Jar holds ${tipCapHours(lvl)} hours of tips` : lvl === 0 ? u.blurb : u.steps[lvl - 1].label}</small>
              </div>
              {next ? (
                <button className={`btn primary${level < next.level ? ' locked' : ''}`} onClick={() => buy(next.cost, next.level, () => setR(buyUpgrade(r, k)))}>
                  {level < next.level ? `Lv ${next.level}` : <>Upgrade <Coin />{next.cost}</>}
                </button>
              ) : (
                <span className="maxed">Maxed</span>
              )}
            </article>
          )
        })}
      </div>

      <h3 className="sect">Your sign</h3>
      <div className="signcard">
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
    </div>
  )
}
