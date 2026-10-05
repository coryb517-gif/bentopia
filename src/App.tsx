import { useCallback, useEffect, useRef, useState } from 'react'
import ArtGallery from './game/ArtGallery'
import { svgUrl } from './game/art'
import Backdrop from './game/Backdrop'
import Hero from './game/Hero'
import BoardView from './game/BoardView'
import { isSoundOn, setSound } from './game/audio'
import Mascot, { type Mood } from './game/Mascot'
import { LEVELS } from './sim/levels'
import { CHAINS } from './sim/items'
import type { GameState } from './sim/types'
import './App.css'

type Screen = 'title' | 'map' | 'play'

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
  const [sound, setSoundOn] = useState(isSoundOn)
  const [mood, setMood] = useState<Mood>('idle')
  const [quip, setQuip] = useState({ text: '', n: 0 })
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const quipCount = useRef(0)

  const level = LEVELS[levelIdx]

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
    setLevelIdx(idx)
    setSeed((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)
    setAttempt((a) => a + 1)
    setGame(null)
    setPreview(null)
    setShowResult(false)
    setScreen('play')
    say("Let's cook!", 'cheer', 1600)
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
    }
    const t = setTimeout(() => setShowResult(true), 800)
    return () => clearTimeout(t)
  }, [game, say])

  const unlocked = (i: number) => i === 0 || (stars[LEVELS[i - 1].id] ?? 0) > 0

  if (screen === 'title') {
    return (
      <main className="screen title">
        <div className="floaters" aria-hidden>{[0, 1, 2, 3, 4, 5].map((k) => <img key={k} className={`floater f${k}`} src={svgUrl(k, 2)} alt="" width={84} height={84} />)}</div>
        <Mascot mood="cheer" size={190} />
        <h1>Bentopia</h1>
        <p className="tag">Sushi Merge</p>
        <button className="btn primary" onClick={() => setScreen('map')}>Play</button>
        <p className="fine">Link 3 or more matching dishes. Drag, or tap one at a time.</p>
      </main>
    )
  }

  if (screen === 'map') {
    const total = Object.values(stars).reduce((a, b) => a + b, 0)
    return (
      <main className="screen map">
        <header className="bar">
          <button className="btn ghost" onClick={() => setScreen('title')}>Back</button>
          <h2>Chapter 1</h2>
          <span className="coin">★ {total}</span>
        </header>
        <div className="maphero">
          <Mascot mood="idle" size={84} />
          <p className="bubble">Pick an order, chef!</p>
        </div>
        <ol className="levels">
          {LEVELS.map((l, i) => (
            <li key={l.id}>
              <button className={`level${stars[l.id] ? ' cleared' : ''}`} disabled={!unlocked(i)} onClick={() => start(i)}>
                <span className="num">{unlocked(i) ? l.id : '🔒'}</span>
                <span className="lname">{l.name}</span>
                <Stars n={stars[l.id] ?? 0} />
              </button>
            </li>
          ))}
        </ol>
      </main>
    )
  }

  const status = game?.status ?? 'playing'
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

      <section className="order" aria-label="Order">
        <ul>
          {level.order.map((o, idx) => (
            <li key={idx} className={(game?.progress[idx] ?? 0) >= o.count ? 'done' : ''}>
              <div className="orow">
                <img className="dish" src={svgUrl(o.kind, o.tier)} alt="" width={38} height={38} />
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
          <>Release to make <img className="dish" src={svgUrl(preview.kind, preview.tier)} alt="" width={28} height={28} /> <b>{CHAINS[preview.kind].names[preview.tier]}</b></>
        ) : (
          <>Link 3+ matching dishes</>
        )}
      </div>

      <BoardView key={`${level.id}-${attempt}`} level={level} seed={seed} onState={onState} onPreview={setPreview} onMerge={onMerge} />

      <footer className="foot">
        <button
          className="btn ghost"
          onClick={() => {
            setSound(!sound)
            setSoundOn(!sound)
          }}
        >
          Sound {sound ? 'on' : 'off'}
        </button>
        <button className="btn ghost" onClick={() => start(levelIdx)}>Restart level</button>
      </footer>

      {showResult && status !== 'playing' && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="card">
            <Mascot mood={status === 'won' ? 'wow' : 'oops'} size={130} />
            {status === 'won' ? (
              <>
                <h2>Order up!</h2>
                <Stars n={game!.stars} big />
                <p>{game!.movesLeft} moves to spare</p>
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
                <div className="actions">
                  <button className="btn primary" onClick={() => start(levelIdx)}>Play level {level.id} again</button>
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
