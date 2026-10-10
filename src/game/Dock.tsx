import type { ReactNode } from 'react'

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
)

const ICONS = {
  decorate: icon(<><path d="M4 20l4-1 10-10-3-3L5 16z" /><path d="M14 7l3 3" /></>),
  build: icon(<><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M10 21v-6h4v6" /></>),
  town: icon(<><path d="M12 3c3 0 5 3 5 7s-2 7-5 7-5-3-5-7 2-7 5-7z" /><path d="M12 17v3M10 3h4" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
}

export type Section = 'decorate' | 'build' | 'town'

interface Props {
  /** Which section you are in, so its button lights up. */
  active?: Section | null
  onDecorate: () => void
  onBuild: () => void
  onTown: () => void
  onPlay: () => void
  onSettings: () => void
  /** No hearts left. */
  resting?: boolean
  /** Icons only, for screens that need every pixel. */
  compact?: boolean
}

/** The one bottom bar for the whole restaurant side of the game: the same everywhere, so you can jump anywhere in one tap. */
export default function Dock({ active = null, onDecorate, onBuild, onTown, onPlay, onSettings, resting = false, compact = false }: Props) {
  const on = (s: Section) => (active === s ? 'on' : undefined)
  return (
    <nav className={`dock${compact ? ' compact' : ''}`} aria-label="Main">
      <button className={on('decorate')} aria-current={active === 'decorate' ? 'page' : undefined} data-coach="decorate" onClick={onDecorate}>{ICONS.decorate}<span>Decorate</span></button>
      <button className={on('build')} aria-current={active === 'build' ? 'page' : undefined} data-coach="build" onClick={onBuild}>{ICONS.build}<span>Build</span></button>
      <button className="playbtn" data-coach="play" onClick={onPlay} disabled={resting} aria-label="Play">
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        <span>{resting ? 'Resting' : 'Play'}</span>
      </button>
      <button className={on('town')} aria-current={active === 'town' ? 'page' : undefined} data-coach="town" onClick={onTown}>{ICONS.town}<span>Town</span></button>
      <button onClick={onSettings}>{ICONS.settings}<span>Settings</span></button>
    </nav>
  )
}
