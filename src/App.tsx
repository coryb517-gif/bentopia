import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import ArtGallery from './game/ArtGallery'
import { svgUrl } from './game/art'
import Backdrop from './game/Backdrop'
import Hero from './game/Hero'
import ExteriorLab from './game/ExteriorLab'
import RoomLab from './game/RoomLab'
import BoardView from './game/BoardView'
import { coinSound, getPref, setPref, startMusic, type Pref } from './game/audio'
import { earn, EXTRA_MOVES, EXTRA_MOVES_COST, levelReward, loadWallet, loseHeart, refundHeart, saveWallet, spend, tick } from './game/economy'
import Coach from './game/Coach'
import Build from './game/Build'
import Decorate from './game/Decorate'
import { loadTutorial, saveTutorial, TUTORIAL_GIFT, inLevelOne } from './game/tutorial'
import Hub from './game/Hub'
import Town from './game/Town'
import { collectTips, loadRestaurant, saveRestaurant, tipsAccrued, type StoreyId } from './game/restaurant'
import type { ViewId } from './game/StoreyTabs'
import CustomerPortrait, { customerFor, type CustomerMood } from './game/Customers'
import Hearts from './game/Hearts'
import Mascot, { type Mood } from './game/Mascot'
import { CHAPTER_RANGES, chapterOf, LEVELS } from './sim/levels'
import { CHAINS, recipeFor } from './sim/items'
import type { GameState } from './sim/types'
import './App.css'

type Screen = 'title' | 'hub' | 'decorate' | 'build' | 'town' | 'map' | 'play'


function hasProgress(): boolean {
  try {
    return Object.keys(JSON.parse(localStorage.getItem('bentopia.stars') ?? '{}')).length > 0 || localStorage.getItem('bentopia.wallet') !== null
  } catch {
    return false
  }
}

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
  if (new URLSearchParams(location.search).has('room')) return <><Backdrop /><RoomLab /></>
  if (new URLSearchParams(location.search).has('exterior')) return <><Backdrop /><ExteriorLab /></>
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
  const [restaurant, setRestaurant] = useState(() => loadRestaurant(Date.now()))
  const [tut, setTut] = useState(() => loadTutorial(hasProgress()))
  const [intro, setIntro] = useState(false)
  const [storey, setStorey] = useState<StoreyId>('ground')
  const [hubView, setHubView] = useState<ViewId>('outside')
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

  // Screens with a HUD at the top calm the backdrop so coins and buttons stay readable.
  useEffect(() => {
    document.body.dataset.screen = screen
  }, [screen])

  // One clock drives heart regeneration and the countdown, and the wallet is saved on every change.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      setWallet((w) => tick(w, Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => saveWallet(wallet), [wallet])
  useEffect(() => saveRestaurant(restaurant), [restaurant])
  useEffect(() => saveTutorial(tut), [tut])
  const tips = tipsAccrued(restaurant, now)

  const collect = () => {
    if (tips <= 0) return
    setWallet((w) => earn(w, tips))
    setRestaurant((x) => collectTips(x, Date.now()))
    coinSound(2)
  }

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
      setTut((t) => (t.step === 'link' ? { ...t, step: 'merged' } : t.step === 'merged' ? { ...t, step: 'play' } : t))
    },
    [say],
  )

  useEffect(() => {
    if (!game || game.status === 'playing') return
    if (game.status === 'won') {
      say('Itadakimasu!', 'wow', 6000)
      if (game.level.id === 1) setTut((t) => (inLevelOne(t.step) ? { ...t, step: 'win' } : t))
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

  // The first-merge callout covers the top of the board, so it clears itself.
  useEffect(() => {
    if (tut.step !== 'merged') return
    const id = setTimeout(() => setTut((t) => (t.step === 'merged' ? { ...t, step: 'play' } : t)), 4500)
    return () => clearTimeout(id)
  }, [tut.step])

  const skipTutorial = () => {
    setTut({ step: 'done', mixedSeen: true })
    setIntro(false)
  }

  const playFromTitle = () => {
    startMusic()
    if (tut.step === 'intro') return setIntro(true)
    if (tut.step === 'link' || tut.step === 'merged' || tut.step === 'play') return start(0)
    setScreen('hub')
  }

  const finishTutorialWin = () => {
    setWallet((w) => earn(w, TUTORIAL_GIFT))
    setTut((t) => ({ ...t, step: 'hub' }))
    setScreen('hub')
    say('Welcome to your restaurant!', 'cheer', 3000)
  }

  const level0Mixed = LEVELS[levelIdx].order.some((o) => recipeFor(o.kind, o.tier))
  let coachEl: ReactNode = null
  if (screen === 'title' && intro) {
    coachEl = (
      <Coach
        text="Hi, I'm Bento-kun! Customers order dishes and you cook them by linking matching food. Let's make your first order together."
        dismissLabel="Let's cook!"
        onDismiss={() => {
          setIntro(false)
          setTut((t) => ({ ...t, step: 'link' }))
          start(0)
        }}
        onSkip={skipTutorial}
      />
    )
  } else if (screen === 'play' && tut.step === 'link') {
    coachEl = <Coach target=".board-host" side="below" dim={false} text="Drag across 3 matching dishes to link them. Follow the finger!" onSkip={skipTutorial} />
  } else if (screen === 'play' && tut.step === 'merged') {
    coachEl = <Coach target=".order" side="below" dim={false} text="Brilliant! 3 rice became an onigiri. Now make 3 onigiri to fill the order." dismissLabel="Got it" onDismiss={() => setTut((t) => ({ ...t, step: 'play' }))} onSkip={skipTutorial} />
  } else if (screen === 'hub' && tut.step === 'hub') {
    coachEl = <Coach target='[data-coach="decorate"]' side="above" text="This is your restaurant! Tap Decorate to make it yours." onSkip={skipTutorial} />
  } else if (screen === 'decorate' && tut.step === 'decorate') {
    coachEl = <Coach target='[data-coach="place"], [data-coach="card-lamp"]' side="above" text="Tap the paper lantern to buy it, then press Place. It lights up the room!" onSkip={skipTutorial} />
  } else if (screen === 'decorate' && tut.step === 'placed') {
    coachEl = <Coach target='[data-coach="done"]' side="below" text="Beautiful! Tap Done to head back." onSkip={skipTutorial} />
  } else if (screen === 'hub' && tut.step === 'back') {
    coachEl = <Coach target='[data-coach="play"]' side="above" text="Customers are waiting. Tap Play for your next order!" onSkip={skipTutorial} />
  } else if (screen === 'play' && tut.step === 'done' && !tut.mixedSeen && level0Mixed) {
    coachEl = <Coach target=".order li .recipe" side="below" text="New trick! Link one of each ingredient, in any order, to make this dish." dismissLabel="Got it" onDismiss={() => setTut((t) => ({ ...t, mixedSeen: true }))} />
  }
  const withCoach = (x: ReactNode) => (
    <>
      {x}
      {coachEl}
    </>
  )
  if (screen === 'title') {
    return withCoach(
      <main className="screen title">
        <div className="floaters" aria-hidden>{[0, 1, 2, 3, 4, 5].map((k) => <img key={k} className={`floater f${k}`} src={svgUrl(k, 2)} alt="" width={84} height={84} />)}</div>
        <Mascot mood="cheer" size={190} />
        <h1>Bentopia</h1>
        <p className="tag">Sushi Merge</p>
        <button className="btn primary" onClick={playFromTitle}>Play</button>
        <p className="fine">Link 3 or more matching dishes. Drag, or tap one at a time.</p>
      </main>
    )
  }

  if (screen === 'hub') {
    return withCoach(
      <Hub
        r={restaurant}
        wallet={wallet}
        now={now}
        tips={tips}
        onCollect={collect}
        onPlay={() => {
          setTut((t) => (t.step === 'back' ? { ...t, step: 'done' } : t))
          setScreen('map')
        }}
        onDecorate={() => {
          setTut((t) => (t.step === 'hub' ? { ...t, step: 'decorate' } : t))
          if (hubView !== 'outside') setStorey(hubView)
          setScreen('decorate')
        }}
        view={hubView}
        onView={setHubView}
        onBuild={() => setScreen('build')}
        onTown={() => setScreen('town')}
        next={(() => {
          const l = LEVELS.find((x) => !(stars[x.id] > 0)) ?? LEVELS[LEVELS.length - 1]
          return { id: l.id, name: l.name, chapter: chapterOf(l.id) }
        })()}
        onContinue={() => start(LEVELS.findIndex((x) => !(stars[x.id] > 0)) >= 0 ? LEVELS.findIndex((x) => !(stars[x.id] > 0)) : LEVELS.length - 1)}
        prefs={prefs}
        onPref={togglePref}
      />
    )
  }

  if (screen === 'decorate') {
    return withCoach(
      <Decorate
        r={restaurant}
        setR={setRestaurant}
        coins={wallet.coins}
        spend={(n) => {
          const paid = spend(wallet, n)
          if (!paid) return false
          setWallet(paid)
          return true
        }}
        earn={(n) => setWallet((w) => earn(w, n))}
        onDone={() => {
          setTut((t) => (t.step === 'placed' || t.step === 'decorate' ? { ...t, step: 'back' } : t))
          setScreen('hub')
        }}
        onBought={() => setTut((t) => (t.step === 'decorate' ? { ...t, step: 'placed' } : t))}
        initialTab={tut.step === 'decorate' ? 'lights' : 'seating'}
        storey={storey}
        onStorey={setStorey}
        onBuild={() => setScreen('build')}
      />
    )
  }
  if (screen === 'town') {
    return withCoach(<Town r={restaurant} onBack={() => setScreen('hub')} />)
  }
  if (screen === 'build') {
    return withCoach(
      <Build
        r={restaurant}
        setR={setRestaurant}
        coins={wallet.coins}
        spend={(n) => {
          const paid = spend(wallet, n)
          if (!paid) return false
          setWallet(paid)
          return true
        }}
        onBack={() => setScreen('hub')}
        onGoto={(id) => {
          setStorey(id)
          setScreen('decorate')
        }}
      />,
    )
  }
  if (screen === 'map') {
    return withCoach(
      <main className="screen map">
        <header className="bar">
          <button className="btn ghost" onClick={() => setScreen('hub')}>Back</button>
          <h2>Levels</h2>
          <span className="spacer" />
        </header>
        <div className="wallet"><Hearts wallet={wallet} now={now} /><span className="coin"><i className="coinicon" />{wallet.coins}</span></div>
        <div className="maphero">
          <Mascot mood="idle" size={84} />
          <p className="bubble">{outOfHearts ? 'Rest a moment, chef...' : 'Pick an order, chef!'}</p>
        </div>
        {CHAPTER_RANGES.map((ch) => (
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

  return withCoach(
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

      <BoardView key={`${level.id}-${attempt}`} level={level} seed={seed} onState={onState} onPreview={setPreview} onMerge={onMerge} grant={grant} hint={tut.step === 'link' ? 'always' : 'auto'} />

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
                  {tut.step === 'win' ? (
                    <button className="btn primary" onClick={finishTutorialWin}>See your restaurant</button>
                  ) : (
                    <>
                      {hasNext && <button className="btn primary" onClick={() => start(levelIdx + 1)}>Play level {level.id + 1}</button>}
                      <button className="btn" onClick={() => start(levelIdx)}>Play level {level.id} again</button>
                      <button className="btn ghost" onClick={() => setScreen('map')}>Level map</button>
                    </>
                  )}
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
