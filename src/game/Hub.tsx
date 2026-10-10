import { useEffect, useState, type ReactNode } from 'react'
import { type Pref } from './audio'
import CustomerPortrait, { customerFor } from './Customers'
import Hearts from './Hearts'
import Mascot from './Mascot'
import Exterior from './Exterior'
import Room from './Room'
import StoreyTabs, { type ViewId } from './StoreyTabs'
import ZoomPan from './ZoomPan'
import type { Avatar } from './avatar'
import { AvatarBadge } from './AvatarFigure'
import { emoteSound, startAmbience, stopAmbience } from './audio'
import { decorScore, levelOf, levelProgress, restaurantLevel, sizeOf, storeyView, type Restaurant } from './restaurant'

interface Props {
  r: Restaurant
  wallet: { coins: number; hearts: number; regenAt: number | null }
  now: number
  tips: number
  onCollect: () => void
  onPlay: () => void
  onDecorate: () => void
  view: ViewId
  onView: (id: ViewId) => void
  onBuild: () => void
  onTown: () => void
  /** The next level to play, for the Continue card. */
  next: { id: number; name: string; chapter: number }
  onContinue: () => void
  prefs: Record<Pref, boolean>
  avatar?: Avatar
  onAvatar?: () => void
  onRewards?: () => void
  onGuest?: (id: string) => void
  rewardDot?: boolean
  onPref: (k: Pref) => void
}

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
)

const ICONS = {
  decorate: icon(<><path d="M4 20l4-1 10-10-3-3L5 16z" /><path d="M14 7l3 3" /></>),
  build: icon(<><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M10 21v-6h4v6" /></>),
  market: icon(<><path d="M12 3c3 0 5 3 5 7s-2 7-5 7-5-3-5-7 2-7 5-7z" /><path d="M12 17v3M10 3h4" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
}

const GREETINGS = ['Welcome back, chef!', 'The lanterns are lit.', 'Table two wants sushi!', 'What a lovely night.']

export default function Hub({ r, wallet, now, tips, onCollect, onPlay, onDecorate, view, onView, onBuild, onTown, next, onContinue, prefs, onPref, avatar, onAvatar, onRewards, onGuest, rewardDot }: Props) {
  const [guestMsg, setGuestMsg] = useState('')
  const [emote, setEmote] = useState({ n: 0, e: '' })
  const [emoteOpen, setEmoteOpen] = useState(false)
  // The restaurant hums softly while you are inside it.
  useEffect(() => {
    if (view === 'outside') return
    startAmbience()
    return stopAmbience
  }, [view])
  const [sheet, setSheet] = useState<'settings' | 'pantry' | 'market' | null>(null)
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const score = decorScore(r)
  const level = levelOf(r)
  const prog = level === restaurantLevel(score) ? levelProgress(score) : null
  const out = wallet.hearts <= 0

  return (
    <main className="screen hub">
      <header className="hubbar">
        <div className="hubleft">
          {avatar && <button className="abadge" onClick={onAvatar} aria-label="Change your look"><AvatarBadge a={avatar} size={42} /></button>}
          <div className="rlevel">
          <b>Lv {level}</b>
          <div className="meter" aria-label={prog ? `${prog.have} of ${prog.need} to the next level` : 'Max level'}>
            <i style={{ width: `${prog ? Math.min(100, (prog.have / prog.need) * 100) : 100}%` }} />
          </div>
        </div>
          {onRewards && <button className="giftbtn" onClick={onRewards} aria-label="Rewards">🎁{rewardDot && <i className="dot" />}</button>}
        </div>
        <div className="wallet mini">
          <Hearts wallet={wallet} now={now} />
          <span className="coin"><i className="coinicon" />{wallet.coins}</span>
        </div>
      </header>

      <StoreyTabs r={r} outside active={view} onPick={onView} onLocked={onBuild} />

      <div className="stage hubstage">
        <ZoomPan resetKey={view}>{view === 'outside' ? <Exterior r={r} onEnter={() => onView('ground')} /> : <Room r={storeyView(r, view)} grid={sizeOf(r, view)} storey={view} avatar={avatar} emote={emote} onGuest={(id) => { onGuest?.(id); setGuestMsg('✨ Ashlyndia stopped by for a bite!'); setTimeout(() => setGuestMsg(''), 6000) }} />}</ZoomPan>
        {avatar && view !== 'outside' && (
          <>
            <button className={`emotetoggle${emoteOpen ? ' on' : ''}`} onClick={() => setEmoteOpen((o) => !o)} aria-label="Emotes" aria-expanded={emoteOpen}>😊</button>
            {emoteOpen && (
              <div className="emotebar" aria-label="Emotes">
                {['👋', '❤️', '🎉', '😋', '😴'].map((e) => <button key={e} onClick={() => { emoteSound(); setEmote((m) => ({ n: m.n + 1, e })); setEmoteOpen(false) }} aria-label={`Emote ${e}`}>{e}</button>)}
              </div>
            )}
          </>
        )}
        {tips > 0 && (
          <button className="tips" onClick={onCollect}>
            <i className="coinicon" /> Collect tips <b>+{tips}</b>
          </button>
        )}
        <div className="hubmascot">
          <Mascot mood={tips > 0 ? 'cheer' : 'idle'} size={64} />
          <p className="bubble">{guestMsg || (out ? 'Rest a moment, chef...' : tips > 0 ? 'Customers left tips!' : greeting)}</p>
        </div>
      </div>

      <section className="nextcard" aria-label="Next order">
        <CustomerPortrait customer={customerFor(next.id)} mood="idle" size={58} />
        <div className="nt">
          <small>Next order · Chapter {next.chapter}</small>
          <b>{next.name}</b>
          <span>{customerFor(next.id).name}: {customerFor(next.id).ask}</span>
        </div>
        <button className="btn primary" onClick={onContinue} disabled={out}>{out ? 'Resting' : `Play ${next.id}`}</button>
      </section>

      <nav className="dock" aria-label="Main">
        <button data-coach="decorate" onClick={onDecorate}>{ICONS.decorate}<span>Decorate</span></button>
        <button data-coach="build" onClick={onBuild}>{ICONS.build}<span>Build</span></button>
        <button className="playbtn" data-coach="play" onClick={onPlay} disabled={out} aria-label="Play">
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          <span>{out ? 'Resting' : 'Play'}</span>
        </button>
        <button data-coach="town" onClick={onTown}>{ICONS.market}<span>Town</span></button>
        <button onClick={() => setSheet('settings')}>{ICONS.settings}<span>Settings</span></button>
      </nav>

      {sheet && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setSheet(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            {sheet === 'settings' ? (
              <>
                <h2>Settings</h2>
                <div className="chips">
                  {(['music', 'sound', 'haptics'] as Pref[]).map((k) => (
                    <button key={k} className={`chip${prefs[k] ? ' on' : ''}`} aria-pressed={prefs[k]} onClick={() => onPref(k)}>
                      {k === 'music' ? 'Music' : k === 'sound' ? 'Sound' : 'Haptics'}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Mascot mood="cheer" size={110} />
                <h2>{sheet === 'pantry' ? 'Pantry' : 'Night Market'}</h2>
                <p>
                  {sheet === 'pantry'
                    ? 'Delivery crates and rare ingredients are coming soon. Keep clearing levels to earn them!'
                    : 'Visit other restaurants and leave tips. It opens when you reach player level 5.'}
                </p>
              </>
            )}
            <div className="actions">
              <button className="btn primary" onClick={() => setSheet(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
