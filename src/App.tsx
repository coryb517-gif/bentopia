import { useCallback, useEffect, useRef, useState } from 'react'
import ArtGallery from './game/ArtGallery'
import { svgUrl } from './game/art'
import Backdrop from './game/Backdrop'
import Hero from './game/Hero'
import BoardView from './game/BoardView'
import { coinSound, getPref, setPref, startMusic, type Pref } from './game/audio'
import { earn, EXTRA_MOVES, EXTRA_MOVES_COST, formatCountdown, levelReward, loadWallet, loseHeart, MAX_HEARTS, msToNextHeart, refundHeart, saveWallet, spend, tick } from './game/economy'
import CustomerPortrait, { customerFor, type CustomerMood } from './game/Customers'
import Mascot, { type Mood } from './game/Mascot'
import { LEVELS } from './sim/levels'
import { CHAINS, recipeFor } from './sim/items'
import type { GameState } from './sim/types'
import './App.css'

type Screen = 'title' | 'map' | 'play'

const CHAPTERS = [
  { title: 'Chapter 1', sub: 'Learn the kitchen', from: 1, to: 10 },
  { title: 'Chapter 2', sub: 'Mix it up', from: 11, to: 20 },
]

function loadStars(): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem('bentopia.stars') ?? '{}')
  } catch {
    return {}
  }
}

const QUIPS = {
  dish: ['Masterpiece!', 'Order up!', "Chef's kiss!"],
  huge: ['INCREDIBLE!', 'What a chain!', 'Wooow!'],
  big: ['Ooh, nice!', 'Delicious!', 'Look at that!'],
  small: ['Yum!', 'Nice link!', 'Tasty!', 'Mmm!'],
}

/** Shows how to make a dish: link 3 of the last step to get the next one. */
function Recipe({ kind, tier }: { kind: number; tier: number }) {
  const mixed = recipeFor(kind, tier)
  if (mixed) {
    return (
      <div className="recipe">
        <span className="step">
          {mixed.inputs.map((inp, n) => (
            <span key={n} className="plus-wrap">
              {n > 0 && <span className="plus" aria-hidden>+</span>}
              <img className="dish" src={svgUrl(inp.kind, inp.tier)} alt="" width={24} height={24} />
            </span>
          ))}
          <span className="arrow" aria-hidden>→</span>
          <img className="dish" src={svgUrl(kind, tier)} alt="" width={32} height={32} />
          <span className="sr">Link one each of {mixed.inputs.map((i) => CHAINS[i.kind].names[i.tier]).join(', ')} to make {CHAINS[kind].names[tier]}</span>
        </span>
      </div>
    )
  }
  const steps = []
  for (let t = 0; t < tier; t++) {
    steps.push(
      <span className="step" key={t}>
        {[0, 1, 2].map((n) => <img key={n} className="dish" src={svgUrl(kind, t)} alt="" width={26} height={26} />)}
        <span className="arrow" aria-hidden>→</span>
        <img className="dish" src={svgUrl(kind, t + 1)} alt="" width={30} height={30} />
        <span className="sr">Link three {CHAINS[kind].names[t]} to make {CHAINS[kind].names[t + 1]}</span>
      </span>,
    )
  }
  return <div className="recipe">{steps}</div>
}

function Hearts({ wallet, now }: { wallet: { hearts: number; regenAt: number | null }; now: number }) {
  const wait = wallet.hearts < MAX_HEARTS && wallet.regenAt !== null ? formatCountdown(msToNextHeart(wallet as never, now)) : null
  return (
    <span className="hearts" aria-label={`${wallet.hearts} of ${MAX_HEARTS} hearts`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <svg key={i} viewBox="0 0 24 22" width="18" height="17" className={i < wallet.hearts ? 'heart on' : 'heart'}>
          <path d="M12 21C4 14.5 1.5 11 1.5 7.2 1.5 4 4 2 6.8 2 9 2 11 3.2 12 5.2 13 3.2 15 2 17.2 2 20 2 22.5 4 22.5 7.2 22.5 11 20 14.5 12 21Z" />
        </svg>
      ))}
      {wait && <small className="regen">{wait}</small>}
    </span>
  )
}

/** Counts up to a value with a ticking coin sound. */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const dur = Math.min(1400, 300 + to * 18)
    let raf = 0
    let last = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const v = Math.round(to * (1 - (1 - p) * (1 - p)))
      if (v !== last) coinSound(v)
      last = v
      setN(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <b>{n}</b>
}

function Stars({ n, big }: { n: number; big?: boolean }) {
  return (
    <span className={big ? 'stars big' : 'stars'} aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'star on' : 'star'} style={{ animationDelay: `${i * 0.35}s` }}>
          ★
        </span>
      ))}
    </span>
  )
}

export default function App() {
  if (new URLSearchParams(location.search).has('art')) return <ArtGallery />
  const hero = new URLSearchParams(location.search).has('hero')
  return (
    <>
      <Backdrop />
      {hero ? <Hero /> : <Game />}
    </>
  )
}

function Game() {
  const [screen, setScreen] = useState<Screen>('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [seed, setSeed] = useState(1)
  const [stars, setStars] = useState(loadStars)
  const [game, setGame] = useState<GameState | null>(null)
  const [preview, setPreview] = useState<{ kind: number; tier: number } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [prefs, setPrefs] = useState<Record<Pref, boolean>>(() => ({ sound: getPref('sound'), music: getPref('music'), haptics: getPref('haptics') }))
  const [wallet, setWallet] = useState(() => tick(loadWallet(), Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [reward, setReward] = useState<number | null>(null)
  const [grant, setGrant] = useState({ id: 0, n: 0 })
  const starsRef = useRef(stars)
  starsRef.current = stars
  const [mood, setMood] = useState<Mood>('idle')
  const [quip, setQuip] = useState({ text: '', n: 0 })
  const [flash, setFlash] = useState(false)
  const prevDone = useRef(0)
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const quipCount = useRef(0)

  const level = LEVELS[levelIdx]
  const outOfHearts = wallet.hearts <= 0

  // One clock drives heart regeneration and the countdown, and the wallet is saved on every change.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      setWallet((w) => tick(w, Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => saveWallet(wallet), [wallet])

  const togglePref = (k: Pref) => {
    const on = !prefs[k]
    setPref(k, on)
    setPrefs((p) => ({ ...p, [k]: on }))
  }
  const customer = customerFor(level.id)

  const say = useCallback((text: string, m: Mood, ms = 1300) => {
    clearTimeout(moodTimer.current)
    setMood(m)
    setQuip((q) => ({ text, n: q.n + 1 }))
    moodTimer.current = setTimeout(() => {
      setMood('idle')
      setQuip((q) => ({ ...q, text: '' }))
    }, ms)
  }, [])

  const start = (idx: number) => {
    if (wallet.hearts <= 0) return
    startMusic()
    setReward(null)
    setLevelIdx(idx)
    setSeed((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)
    setAttempt((a) => a + 1)
    setGame(null)
    setPreview(null)
    setShowResult(false)
    setScreen('play')
    const mixed = LEVELS[idx].order.some((o) => recipeFor(o.kind, o.tier))
    say(mixed ? 'One of each!' : "Let's cook!", 'cheer', mixed ? 2800 : 1600)
  }

  const onState = useCallback((s: GameState) => setGame(s), [])

  const onMerge = useCallback(
    (len: number, tier: number) => {
      const pool = tier >= 2 ? QUIPS.dish : len >= 5 ? QUIPS.huge : len === 4 ? QUIPS.big : QUIPS.small
      say(pool[quipCount.current++ % pool.length], tier >= 2 || len >= 5 ? 'wow' : 'cheer')
    },
    [say],
  )

  useEffect(() => {
    if (!game || game.status === 'playing') return
    if (game.status === 'won') {
      say('Itadakimasu!', 'wow', 6000)
      const coins = levelReward(game.stars, game.movesLeft, !(starsRef.current[game.level.id] > 0))
      setReward(coins)
      setWallet((w) => earn(w, coins))
      setStars((prev) => {
        const next = { ...prev, [game.level.id]: Math.max(prev[game.level.id] ?? 0, game.stars) }
        try {
          localStorage.setItem('bentopia.stars', JSON.stringify(next))
        } catch {
          /* storage unavailable */
        }
        return next
      })
    } else {
      say('Oh no! So close...', 'oops', 6000)
      setWallet((w) => loseHeart(w, Date.now()))
    }
    const t = setTimeout(() => setShowResult(true), 800)
    return () => clearTimeout(t)
  }, [game, say])

  // The customer perks up whenever one line of their order is completed.
  useEffect(() => {
    if (!game) {
      prevDone.current = 0
      return
    }
    const done = game.level.order.filter((o, i) => game.progress[i] >= o.count).length
    if (done > prevDone.current && game.status === 'playing') {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1600)
      prevDone.current = done
      return () => clearTimeout(t)
    }
    prevDone.current = done
  }, [game])
  const unlocked = (i: number) => i === 0 || (stars[LEVELS[i - 1].id] ?? 0) > 0

  if (screen === 'title') {
    return (
      <main className="screen title">
        <div className="floaters" aria-hidden>{[0, 1, 2, 3, 4, 5].map((k) => <img key={k} className={`floater f${k}`} src={svgUrl(k, 2)} alt="" width={84} height={84} />)}</div>
        <Mascot mood="cheer" size={190} />
        <h1>Bentopia</h1>
        <p className="tag">Sushi Merge</p>
        <button className="btn primary" onClick={() => { startMusic(); setScreen('map') }}>Play</button>
        <p className="fine">Link 3 or more matching dishes. Drag, or tap one at a time.</p>
      </main>
    )
  }

  if (screen === 'map') {
    return (
      <main className="screen map">
        <header className="bar">
          <button className="btn ghost" onClick={() => setScreen('title')}>Back</button>
          <h2>Levels</h2>
          <span className="spacer" />
        </header>
        <div className="wallet"><Hearts wallet={wallet} now={now} /><span className="coin"><i className="coinicon" />{wallet.coins}</span></div>
        <div className="maphero">
          <Mascot mood="idle" size={84} />
          <p className="bubble">{outOfHearts ? 'Rest a moment, chef...' : 'Pick an order, chef!'}</p>
        </div>
        {CHAPTERS.map((ch) => (
          <section key={ch.title} className="chapter">
            <h3>{ch.title}<small>{ch.sub}</small></h3>
            <ol className="levels">
              {LEVELS.slice(ch.from - 1, ch.to).map((l) => {
                const i = l.id - 1
                return (
                  <li key={l.id}>
                    <button className={`level${stars[l.id] ? ' cleared' : ''}`} disabled={!unlocked(i) || outOfHearts} onClick={() => start(i)}>
                      <span className="num">{unlocked(i) ? l.id : '🔒'}</span>
                      <span className="lname">{l.name}</span>
                      <Stars n={stars[l.id] ?? 0} />
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </main>
    )
  }

  const status = game?.status ?? 'playing'
  const custMood: CustomerMood = status === 'won' ? 'happy' : status === 'lost' ? 'sad' : flash ? 'happy' : 'idle'
  const custLine = status === 'won' ? customer.win : status === 'lost' ? customer.lose : customer.ask
  const hasNext = levelIdx + 1 < LEVELS.length

  return (
    <main className="screen play">
      <header className="hud">
        <button className="btn ghost round" onClick={() => setScreen('map')} aria-label="Leave level">✕</button>
        <div className="levelname">Level {level.id}<small>{level.name}</small></div>
        <div className="mascot-wrap">
          <Mascot mood={mood} size={84} />
          {quip.text && <span key={quip.n} className="quip">{quip.text}</span>}
        </div>
        <div className="moves" aria-live="polite">
          <b>{game?.movesLeft ?? level.moves}</b>
          <small>moves</small>
        </div>
      </header>

      <div className="customer-row">
        <CustomerPortrait customer={customer} mood={custMood} size={66} />
        <p className="ask" key={custMood}><b>{customer.name}</b>{custLine}</p>
      </div>

      <section className="order" aria-label="Order">
        <ul>
          {level.order.map((o, idx) => (
            <li key={idx} className={(game?.progress[idx] ?? 0) >= o.count ? 'done' : ''}>
              <div className="orow">
                <img className="dish" src={svgUrl(o.kind, o.tier)} alt="" width={32} height={32} />
                <span className="oname"><span className="need">Make</span>{CHAINS[o.kind].names[o.tier]}</span>
                <b>{game?.progress[idx] ?? 0}/{o.count}</b>
              </div>
              <Recipe kind={o.kind} tier={o.tier} />
            </li>
          ))}
        </ul>
      </section>

      <div className="preview" aria-live="polite">
        {preview ? (
          <>Release to make <img className="dish" src={svgUrl(preview.kind, preview.tier)} alt="" width={24} height={24} /> <b>{CHAINS[preview.kind].names[preview.tier]}</b></>
        ) : (
          <>Link 3+ matching dishes</>
        )}
      </div>

      <BoardView key={`${level.id}-${attempt}`} level={level} seed={seed} onState={onState} onPreview={setPreview} onMerge={onMerge} grant={grant} />

      <footer className="foot">
        {(['music', 'sound', 'haptics'] as Pref[]).map((k) => (
          <button key={k} className={`chip${prefs[k] ? ' on' : ''}`} aria-pressed={prefs[k]} onClick={() => togglePref(k)}>
            {k === 'music' ? 'Music' : k === 'sound' ? 'Sound' : 'Haptics'}
          </button>
        ))}
        <button className="chip" onClick={() => start(levelIdx)} aria-label="Restart level">Restart</button>
      </footer>

      {showResult && status !== 'playing' && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="card">
            <CustomerPortrait customer={customer} mood={status === 'won' ? 'happy' : 'sad'} size={120} />
            <p className="ask solo"><b>{customer.name}</b>{custLine}</p>
            {status === 'won' ? (
              <>
                <h2>Order up!</h2>
                <Stars n={game!.stars} big />
                <p>{game!.movesLeft} moves to spare</p>
                {reward !== null && <div className="reward"><i className="coinicon" />+<CountUp to={reward} /> coins</div>}
                <div className="actions">
                  {hasNext && <button className="btn primary" onClick={() => start(levelIdx + 1)}>Play level {level.id + 1}</button>}
                  <button className="btn" onClick={() => start(levelIdx)}>Play level {level.id} again</button>
                  <button className="btn ghost" onClick={() => setScreen('map')}>Level map</button>
                </div>
              </>
            ) : (
              <>
                <h2>Out of moves</h2>
                <p>The customer will wait. Give level {level.id} another go.</p>
                <Hearts wallet={wallet} now={now} />
                {wallet.coins >= EXTRA_MOVES_COST && (
                  <button
                    className="btn primary"
                    onClick={() => {
                      const paid = spend(wallet, EXTRA_MOVES_COST)
                      if (!paid) return
                      setWallet(refundHeart(paid))
                      setShowResult(false)
                      setGrant((g) => ({ id: g.id + 1, n: EXTRA_MOVES }))
                      say('Back in the kitchen!', 'cheer')
                    }}
                  >
                    +{EXTRA_MOVES} moves for <i className="coinicon" />{EXTRA_MOVES_COST}
                  </button>
                )}
                <div className="actions">
                  <button className="btn" disabled={outOfHearts} onClick={() => start(levelIdx)}>{outOfHearts ? 'Out of hearts' : `Play level ${level.id} again`}</button>
                  <button className="btn ghost" onClick={() => setScreen('map')}>Level map</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
