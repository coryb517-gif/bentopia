import { useEffect, useRef, type ReactNode } from 'react'
import { CHAPTER_RANGES, isBoss, LEVELS } from '../sim/levels'

interface Props {
  stars: Record<number, number>
  unlocked: (index: number) => boolean
  /** No hearts left: nodes cannot be started. */
  resting: boolean
  onPick: (index: number) => void
}

const COLS = [17, 50, 83]
const ROW_H = 112

/** Scenery behind each chapter's title. */
const SCENES: ReactNode[] = [
  // Chapter 1: the market street
  <svg key="s1" viewBox="0 0 340 90" preserveAspectRatio="xMidYMax slice" aria-hidden>
    <rect width="340" height="90" fill="url(#c1)" />
    <defs><linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2370" /><stop offset="1" stopColor="#c0508a" /></linearGradient></defs>
    <path d="M0 90V62h28l10-14 10 14h38V50l14-12 14 12v12h46l12-18 12 18h60V56h28l10-12 10 12h50V90Z" fill="#1d0f40" />
    {[22, 70, 120, 176, 230, 290].map((x, i) => <g key={i}><line x1={x} y1="0" x2={x} y2={14 + (i % 3) * 6} stroke="rgba(255,214,130,0.5)" /><ellipse cx={x} cy={22 + (i % 3) * 6} rx="6" ry="8" fill="#ff7a45" stroke="#2a0f2e" strokeWidth="1.6" /></g>)}
  </svg>,
  // Chapter 2: the harbour
  <svg key="s2" viewBox="0 0 340 90" preserveAspectRatio="xMidYMax slice" aria-hidden>
    <rect width="340" height="90" fill="url(#c2)" />
    <defs><linearGradient id="c2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2a6a" /><stop offset="1" stopColor="#3f8fc8" /></linearGradient></defs>
    <circle cx="270" cy="26" r="13" fill="#fff3c4" opacity="0.9" />
    <path d="M0 70q20 -8 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0V90H0Z" fill="#1d4f86" />
    <path d="M0 80q20 -6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0V90H0Z" fill="#163f70" />
    <path d="M120 66l36 0l-8 12h-20z" fill="#7a4a30" stroke="#2a0f2e" strokeWidth="1.6" strokeLinejoin="round" /><path d="M138 66V34l22 28z" fill="#fff6e0" stroke="#2a0f2e" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>,
  // Chapter 3: the mountain onsen
  <svg key="s3" viewBox="0 0 340 90" preserveAspectRatio="xMidYMax slice" aria-hidden>
    <rect width="340" height="90" fill="url(#c3)" />
    <defs><linearGradient id="c3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b3a7a" /><stop offset="1" stopColor="#8a5a9a" /></linearGradient></defs>
    <path d="M0 90V54l50 -26 40 22 60 -34 70 38 50 -20 70 30V90Z" fill="#1f2a5a" />
    <path d="M0 90V70l60 -16 70 14 80 -18 60 12 70 -8V90Z" fill="#171f44" />
    {[200, 226, 250].map((x, i) => <path key={i} className="steam" style={{ animationDelay: `${-i * 0.9}s` }} d={`M${x} 74q-5 -8 0 -14t0 -14`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />)}
  </svg>,
  // Chapter 4: the grand kitchen
  <svg key="s4" viewBox="0 0 340 90" preserveAspectRatio="xMidYMax slice" aria-hidden>
    <rect width="340" height="90" fill="url(#c4)" />
    <defs><linearGradient id="c4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a1d5a" /><stop offset="1" stopColor="#ff9a4e" /></linearGradient></defs>
    {[30, 80, 150, 210, 260, 310].map((x, i) => <path key={i} className="twinkle" style={{ animationDelay: `${-i * 0.7}s` }} d={`M${x} ${14 + (i % 3) * 12}l2 5l5 2l-5 2l-2 5l-2 -5l-5 -2l5 -2z`} fill="#ffe9a0" />)}
    <path d="M110 90V58h120V90Z" fill="#2a0f2e" /><path d="M132 58q0 -24 38 -24t38 24z" fill="#fff6e0" stroke="#2a0f2e" strokeWidth="2" />
  </svg>,
]

/** A winding board-game path for each chapter. Cleared steps glow gold; the next one pulses. */
export default function LevelMap({ stars, unlocked, resting, onPick }: Props) {
  const currentRef = useRef<HTMLButtonElement>(null)
  const current = LEVELS.findIndex((l) => !(stars[l.id] > 0))

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="lmap">
      {CHAPTER_RANGES.map((ch, ci) => {
        const levels = LEVELS.slice(ch.from - 1, ch.to)
        const rows = Math.ceil(levels.length / 3)
        const H = rows * ROW_H
        const pos = levels.map((_, k) => {
          const row = Math.floor(k / 3)
          const col = row % 2 === 0 ? k % 3 : 2 - (k % 3)
          return { x: COLS[col], y: row * ROW_H + ROW_H / 2 }
        })
        const segs = pos.slice(1).map((p, k) => {
          const a = pos[k]
          const open = (stars[levels[k].id] ?? 0) > 0
          const turn = Math.abs(a.y - p.y) > 1
          const d = turn ? `M${a.x} ${a.y}C${a.x + (a.x > 50 ? 22 : -22)} ${a.y + 10} ${p.x + (p.x > 50 ? 22 : -22)} ${p.y - 10} ${p.x} ${p.y}` : `M${a.x} ${a.y}L${p.x} ${p.y}`
          return <path key={k} d={d} className={open ? 'seg on' : 'seg'} vectorEffect="non-scaling-stroke" fill="none" />
        })
        const done = levels.filter((l) => (stars[l.id] ?? 0) > 0).length
        return (
          <section key={ch.title} className="lchapter">
            <header className="lbanner">
              {SCENES[ci % SCENES.length]}
              <div className="lbtitle">
                <h3>{ch.title}</h3>
                <p>{ch.sub}</p>
              </div>
              <span className="lbcount">{done}/{levels.length}</span>
            </header>
            <div className="lpath" style={{ height: H }}>
              <svg className="lpathsvg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>{segs}</svg>
              {levels.map((l, k) => {
                const idx = l.id - 1
                const open = unlocked(idx)
                const got = stars[l.id] ?? 0
                const boss = isBoss(l.id)
                const isCurrent = idx === current
                return (
                  <button
                    key={l.id}
                    ref={isCurrent ? currentRef : undefined}
                    className={`node${boss ? ' boss' : ''}${got ? ' cleared' : ''}${isCurrent ? ' current' : ''}${open ? '' : ' locked'}`}
                    style={{ left: `${pos[k].x}%`, top: pos[k].y }}
                    disabled={!open || resting}
                    onClick={() => onPick(idx)}
                    aria-label={`Level ${l.id}, ${l.name}${got ? `, ${got} stars` : ''}${boss ? ', boss' : ''}`}
                  >
                    {boss && <i className="crown" aria-hidden>👑</i>}
                    <span className="nnum">{open ? l.id : '🔒'}</span>
                    <span className="nstars" aria-hidden>
                      {[1, 2, 3].map((n) => <b key={n} className={n <= got ? 'on' : ''}>★</b>)}
                    </span>
                    <span className="nname">{l.name}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
