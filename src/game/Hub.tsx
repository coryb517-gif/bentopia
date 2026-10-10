import { useEffect, useState } from 'react'
import CustomerPortrait, { customerFor } from './Customers'
import Hearts from './Hearts'
import Mascot from './Mascot'
import Exterior from './Exterior'
import Room from './Room'
import StoreyTabs, { type ViewId } from './StoreyTabs'
import ZoomPan from './ZoomPan'
import Dock from './Dock'
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
  avatar?: Avatar
  onAvatar?: () => void
  onRewards?: () => void
  onGuest?: (id: string) => void
  rewardDot?: boolean
  onSettings: () => void
}

const GREETINGS = ['Welcome back, chef!', 'The lanterns are lit.', 'Table two wants sushi!', 'What a lovely night.']

/** Whole numbers up to 99,999, then 123k, 1.2M. Keeps the header from growing. */
export const shortNumber = (n: number): string => (n < 100_000 ? String(n) : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n))

export default function Hub({ r, wallet, now, tips, onCollect, onPlay, onDecorate, view, onView, onBuild, onTown, next, onContinue, avatar, onAvatar, onRewards, onGuest, onSettings, rewardDot }: Props) {
  const [guestMsg, setGuestMsg] = useState('')
  const [emote, setEmote] = useState({ n: 0, e: '' })
  const [emoteOpen, setEmoteOpen] = useState(false)
  // The restaurant hums softly while you are inside it.
  useEffect(() => {
    if (view === 'outside') return
    startAmbience()
    return stopAmbience
  }, [view])
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
          <Hearts wallet={wallet} now={now} compact />
          <span className="coin"><i className="coinicon" />{shortNumber(wallet.coins)}</span>
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

      <Dock onDecorate={onDecorate} onBuild={onBuild} onTown={onTown} onPlay={onPlay} onSettings={onSettings} resting={out} />
    </main>
  )
}
