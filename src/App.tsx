import { useCallback, useEffect, useState } from 'react'
import ArtGallery from './game/ArtGallery'
import { svgUrl } from './game/art'
import BoardView from './game/BoardView'
import { isSoundOn, setSound } from './game/audio'
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

/** Shows how to make a dish: link 3 of the last step to get the next one. */
function Recipe({ kind, tier }: { kind: number; tier: number }) {
  const steps = []
  for (let t = 0; t < tier; t++) {
    steps.push(
      <span className="step" key={t}>
        {[0, 1, 2].map((n) => <img key={n} className="dish" src={svgUrl(kind, t)} alt="" width={24} height={24} />)}
        <span className="arrow" aria-hidden>→</span>
        <img className="dish" src={svgUrl(kind, t + 1)} alt="" width={26} height={26} />
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
  return <Game />
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

  const level = LEVELS[levelIdx]

  const start = (idx: number) => {
    setLevelIdx(idx)
    setSeed((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)
    setAttempt((a) => a + 1)
    setGame(null)
    setPreview(null)
    setShowResult(false)
    setScreen('play')
  }

  const onState = useCallback((s: GameState) => setGame(s), [])

  useEffect(() => {
    if (!game || game.status === 'playing') return
    if (game.status === 'won') {
      setStars((prev) => {
        const next = { ...prev, [game.level.id]: Math.max(prev[game.level.id] ?? 0, game.stars) }
        try {
          localStorage.setItem('bentopia.stars', JSON.stringify(next))
        } catch {
          /* storage unavailable */
        }
        return next
      })
    }
    const t = setTimeout(() => setShowResult(true), 800)
    return () => clearTimeout(t)
  }, [game])

  const unlocked = (i: number) => i === 0 || (stars[LEVELS[i - 1].id] ?? 0) > 0

  if (screen === 'title') {
    return (
      <main className="screen title">
        <div className="floaters" aria-hidden>{[0, 1, 2, 3, 4, 5].map((k) => <img key={k} className={`floater f${k}`} src={svgUrl(k, 2)} alt="" width={84} height={84} />)}</div>
        <img className="logo" src={svgUrl(0, 2)} alt="" width={170} height={170} />
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
        <ol className="levels">
          {LEVELS.map((l, i) => (
            <li key={l.id}>
              <button className="level" disabled={!unlocked(i)} onClick={() => start(i)}>
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
        <button className="btn ghost" onClick={() => setScreen('map')} aria-label="Leave level">✕</button>
        <div className="order" aria-label="Order">
          <ul>
            {level.order.map((o, idx) => (
              <li key={idx} className={(game?.progress[idx] ?? 0) >= o.count ? 'done' : ''}>
                <div className="orow">
                  <span className="need">Make</span>
                  <img className="dish" src={svgUrl(o.kind, o.tier)} alt="" width={40} height={40} />
                  <span className="oname">{CHAINS[o.kind].names[o.tier]}</span>
                  <b>{game?.progress[idx] ?? 0}/{o.count}</b>
                </div>
                <Recipe kind={o.kind} tier={o.tier} />
              </li>
            ))}
          </ul>
        </div>
        <div className="moves" aria-live="polite">
          <b>{game?.movesLeft ?? level.moves}</b>
          <small>moves</small>
        </div>
      </header>

      <div className="preview" aria-live="polite">
        {preview ? (
          <>Release to make <img className="dish" src={svgUrl(preview.kind, preview.tier)} alt="" width={26} height={26} /> {CHAINS[preview.kind].names[preview.tier]}</>
        ) : (
          <>Level {level.id}: {level.name}</>
        )}
      </div>

      <BoardView key={`${level.id}-${attempt}`} level={level} seed={seed} onState={onState} onPreview={setPreview} />

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
