import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import ArtGallery from './game/ArtGallery'
import { svgUrl } from './game/art'
import Backdrop from './game/Backdrop'
import Hero from './game/Hero'
import Og from './game/Og'
import ExteriorLab from './game/ExteriorLab'
import RoomLab from './game/RoomLab'
import BoardView from './game/BoardView'
import { claimSound, coinSound, getPref, setPref, startMusic, type Pref } from './game/audio'
import { earn, EXTRA_MOVES, EXTRA_MOVES_COST, levelReward, loadWallet, loseHeart, refundHeart, saveWallet, spend, tick } from './game/economy'
import Coach from './game/Coach'
import Decorate from './game/Decorate'
import { loadTutorial, saveTutorial, TUTORIAL_GIFT, inLevelOne } from './game/tutorial'
import Hub from './game/Hub'
import Town from './game/Town'
import AvatarCreator from './game/AvatarCreator'
import type { StudioMode } from './game/Decorate'
import Rewards from './game/Rewards'
import { bumpWeekly, claimDaily, claimGoal, claimWeekly, hasRewardWaiting, loadProgress, noteItems, saveProgress, type Goal, type GoalContext, type WeeklyKey } from './game/progress'
import { DEFAULT_AVATAR, loadAvatar, saveAvatar, type Avatar } from './game/avatar'
import { collectTips, loadRestaurant, saveRestaurant, tipsAccrued, type StoreyId } from './game/restaurant'
import type { ViewId } from './game/StoreyTabs'
import CustomerPortrait, { CUSTOMERS, customerFor, type CustomerMood } from './game/Customers'
import Hearts from './game/Hearts'
import Mascot, { type Mood } from './game/Mascot'
import { CHAPTER_INTROS, CHAPTER_RANGES, chapterOf, isBoss, LEVELS } from './sim/levels'
import LevelMap from './game/LevelMap'
import { CHAINS, recipeFor } from './sim/items'
import { isBomb } from './sim/engine'
import type { GameState } from './sim/types'
import './App.css'

type Screen = 'title' | 'avatar' | 'hub' | 'decorate' | 'town' | 'map' | 'play'


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
  huge: ['Flavor bomb!', 'What a chain!', 'Wooow!'],
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

const HINT_COST = 10

const TIPS = [
  'Link five or more of one ingredient and you leave a Flavor Bomb. Tap it to clear its row and column.',
  'Land each crafted dish next to its siblings, so the next chain is one short drag away.',
  'Stuck? Pause for a moment and a finger will trace a good chain.',
  'A finished dish takes four links, so count your moves before you start.',
  'Dishes made of different ingredients: link one of each, in any order.',
]

/** The order preview: who is asking, what they want, how many moves you get. */
function PreLevel({ idx, stars, resting, onPlay, onClose }: { idx: number; stars: Record<number, number>; resting: boolean; onPlay: () => void; onClose: () => void }) {
  const l = LEVELS[idx]
  const cust = customerFor(l.id)
  const got = stars[l.id] ?? 0
  const mixed = l.order.some((o) => recipeFor(o.kind, o.tier))
  const tip = mixed && l.id % 2 === 0 ? TIPS[4] : TIPS[l.id % 4]
  const intro = CHAPTER_RANGES.some((c) => c.from === l.id) ? CHAPTER_INTROS[chapterOf(l.id) - 1] : null
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Level ${l.id}`} onClick={onClose}>
      <div className="card prelevel" onClick={(e) => e.stopPropagation()}>
        {intro && (
          <div className="chapterintro">
            <CustomerPortrait customer={CUSTOMERS.find((c) => c.id === intro.speaker) ?? cust} mood="happy" size={54} />
            <div>
              <small>{CHAPTER_RANGES[chapterOf(l.id) - 1].title} · {CHAPTER_RANGES[chapterOf(l.id) - 1].sub}</small>
              <p>“{intro.line}”</p>
              <b>New: {intro.idea}</b>
            </div>
          </div>
        )}
        <CustomerPortrait customer={cust} mood="idle" size={86} />
        <p className="ask solo"><b>{cust.name}</b>{cust.ask}</p>
        <h2>Level {l.id}{isBoss(l.id) && <span className="bosstag">Boss</span>}</h2>
        <p className="lvname">{l.name}</p>
        <ul className="preorder">
          {l.order.map((o, i) => (
            <li key={i}>
              <img className="dish" src={svgUrl(o.kind, o.tier)} alt="" width={34} height={34} />
              <span>{o.count} × {CHAINS[o.kind].names[o.tier]}</span>
              <Recipe kind={o.kind} tier={o.tier} />
            </li>
          ))}
        </ul>
        <div className="prestats">
          <span><b>{l.moves}</b> moves</span>
          <span>{got > 0 ? <Stars n={got} /> : 'First time'}</span>
        </div>
        <p className="pretip">{l.ice ? '❄️ Some tiles start frozen. Clear a chain next to one to crack its ice. A Flavor Bomb shatters it outright.' : tip}</p>
        <div className="actions">
          <button className="btn primary" disabled={resting} onClick={onPlay}>{resting ? 'Out of hearts' : `Play level ${l.id}`}</button>
          <button className="btn ghost" onClick={onClose}>Not yet</button>
        </div>
      </div>
    </div>
  )
}
export default function App() {
  if (new URLSearchParams(location.search).has('art')) return <ArtGallery />
  const hero = new URLSearchParams(location.search).has('hero')
  const og = new URLSearchParams(location.search).has('og')
  if (new URLSearchParams(location.search).has('room')) return <><Backdrop /><RoomLab /></>
  if (new URLSearchParams(location.search).has('exterior')) return <><Backdrop /><ExteriorLab /></>
  return (
    <>
      <Backdrop />
      {og ? <Og /> : hero ? <Hero /> : <Game />}
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
  const [hints, setHints] = useState({ key: '', used: 0, ping: 0 })
  const [restaurant, setRestaurant] = useState(() => loadRestaurant(Date.now()))
  const [tut, setTut] = useState(() => loadTutorial(hasProgress()))
  const [intro, setIntro] = useState(false)
  const [avatar, setAvatar] = useState<Avatar | null>(() => loadAvatar())
  const avatarBack = useRef<Screen>('title')
  const [progress, setProgress] = useState(() => loadProgress())
  const [showRewards, setShowRewards] = useState(false)
  const [studioMode, setStudioMode] = useState<StudioMode>('furniture')
  useEffect(() => saveProgress(progress), [progress])
  useEffect(() => setProgress((p) => noteItems(p, restaurant)), [restaurant])
  const goalCtx: GoalContext = { stars, restaurant, progress }
  const [pending, setPending] = useState<number | null>(null)
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
  const boardKey = `${level.id}-${attempt}`
  const hintsUsed = hints.key === boardKey ? hints.used : 0
  /** The first hint on each try is free; after that a small fee. */
  const hintCost = hintsUsed === 0 ? 0 : HINT_COST
  const askHint = () => {
    if (!game || game.status !== 'playing') return
    if (hintCost > 0) {
      const paid = spend(wallet, hintCost)
      if (!paid) return
      setWallet(paid)
    }
    coinSound(1)
    setHints((h) => ({ key: boardKey, used: (h.key === boardKey ? h.used : 0) + 1, ping: h.ping + 1 }))
  }

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

  const onBomb = useCallback((cleared: number) => {
    setProgress((p) => bumpWeekly({ ...p, stats: { ...p.stats, bombs: p.stats.bombs + 1 } }, 'bombs', 1, Date.now()))
    say(cleared > 4 ? 'BOOM! Fresh ingredients!' : 'Boom!', 'wow')
  }, [say])

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
      setProgress((p) => bumpWeekly(p, 'clears', 1, Date.now()))
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
    if (!avatar) {
      avatarBack.current = 'title'
      return setScreen('avatar')
    }
    proceedFromTitle()
  }

  const proceedFromTitle = () => {
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

  const claimDailyReward = () => {
    const got = claimDaily(progress, Date.now())
    if (!got) return
    setProgress(got.progress)
    setWallet((w) => earn(w, got.reward))
    claimSound()
  }
  const claimWeeklyReward = (id: WeeklyKey | 'bonus') => {
    const got = claimWeekly(progress, id, Date.now())
    if (!got) return
    setProgress(got.progress)
    setWallet((w) => earn(w, got.reward))
    claimSound()
  }
  const claimGoalReward = (g: Goal) => {
    const next = claimGoal(progress, g, goalCtx)
    if (!next) return
    setProgress(next)
    setWallet((w) => earn(w, g.reward))
    claimSound()
  }

  if (screen === 'hub') {
    return withCoach(<>
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
          setStudioMode('furniture')
          setScreen('decorate')
        }}
        view={hubView}
        onView={setHubView}
        onBuild={() => {
          if (hubView !== 'outside') setStorey(hubView)
          setStudioMode('build')
          setScreen('decorate')
        }}
        onTown={() => setScreen('town')}
        next={(() => {
          const l = LEVELS.find((x) => !(stars[x.id] > 0)) ?? LEVELS[LEVELS.length - 1]
          return { id: l.id, name: l.name, chapter: chapterOf(l.id) }
        })()}
        onContinue={() => start(LEVELS.findIndex((x) => !(stars[x.id] > 0)) >= 0 ? LEVELS.findIndex((x) => !(stars[x.id] > 0)) : LEVELS.length - 1)}
        prefs={prefs}
        onPref={togglePref}
        avatar={avatar ?? undefined}
        onRewards={() => setShowRewards(true)}
        onGuest={(id) => id === 'ashlyndia' && setProgress((p) => ({ ...p, stats: { ...p.stats, ashlyndia: p.stats.ashlyndia + 1 } }))}
        rewardDot={hasRewardWaiting(goalCtx, now)}
        onAvatar={() => {
          avatarBack.current = 'hub'
          setScreen('avatar')
        }}
      />
      {showRewards && <Rewards ctx={goalCtx} now={now} onClaimDaily={claimDailyReward} onClaimGoal={claimGoalReward} onClaimWeekly={claimWeeklyReward} onClose={() => setShowRewards(false)} />}
    </>)
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
        onBought={() => {
          setProgress((p) => bumpWeekly(p, 'placed', 1, Date.now()))
          setTut((t) => (t.step === 'decorate' ? { ...t, step: 'placed' } : t))
        }}
        initialTab={tut.step === 'decorate' ? 'lights' : 'seating'}
        storey={storey}
        onStorey={setStorey}
        initialMode={studioMode}
      />
    )
  }
  if (screen === 'avatar') {
    return (
      <AvatarCreator
        initial={avatar ?? DEFAULT_AVATAR}
        first={avatarBack.current === 'title'}
        onCancel={avatarBack.current === 'title' ? undefined : () => setScreen(avatarBack.current)}
        onDone={(a) => {
          setAvatar(a)
          saveAvatar(a)
          if (avatarBack.current === 'title') {
            setScreen('title')
            proceedFromTitle()
          }
          else setScreen(avatarBack.current)
        }}
      />
    )
  }
  if (screen === 'town') {
    return withCoach(
      <Town
        r={restaurant}
        avatar={avatar ?? DEFAULT_AVATAR}
        onEditAvatar={() => {
          avatarBack.current = 'town'
          setScreen('avatar')
        }}
        onVisit={() => setProgress((p) => ({ ...p, stats: { ...p.stats, visits: p.stats.visits + 1 } }))}
        onBack={() => setScreen('hub')}
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
        <LevelMap stars={stars} unlocked={unlocked} resting={outOfHearts} onPick={setPending} />
        {pending !== null && <PreLevel idx={pending} stars={stars} resting={outOfHearts} onPlay={() => { const p = pending; setPending(null); start(p) }} onClose={() => setPending(null)} />}
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
          <>{game?.cells.some(isBomb) ? <b>Tap the Flavor Bomb to clear its row and column!</b> : game?.cells.some((c) => c?.ice) ? 'Clear a chain next to frozen tiles to thaw them' : 'Link 3+ matching dishes'}</>
        )}
      </div>

      <BoardView key={boardKey} level={level} seed={seed} onState={onState} onPreview={setPreview} onMerge={onMerge} onBomb={onBomb} grant={grant} hint={tut.step === 'link' ? 'always' : 'auto'} ping={hints.ping} />

      <footer className="foot">
        {(['music', 'sound', 'haptics'] as Pref[]).map((k) => (
          <button key={k} className={`chip${prefs[k] ? ' on' : ''}`} aria-pressed={prefs[k]} onClick={() => togglePref(k)}>
            {k === 'music' ? 'Music' : k === 'sound' ? 'Sound' : 'Haptics'}
          </button>
        ))}
        <button className="chip hintchip" onClick={askHint} disabled={game?.status !== 'playing' || (hintCost > 0 && wallet.coins < hintCost)} aria-label="Show a hint">💡 Hint{hintCost > 0 ? ` ${hintCost}` : ' free'}</button>
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
