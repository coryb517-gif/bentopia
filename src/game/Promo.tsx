import { useEffect, useState } from 'react'
import { loadAllArt } from './art'
import Exterior from './Exterior'
import { grown } from './ExteriorLab'
import { tileCanvas } from './render'

/** The picture for the cdblogic.com tile, at /?promo (1536x1024). The top-left stays calm for the site's headline. */
export default function Promo() {
  const [art, setArt] = useState<Record<string, string> | null>(null)
  useEffect(() => {
    loadAllArt().then(() => {
      const make = (kind: number, tier: number) => tileCanvas(kind, tier, 200, 2).toDataURL('image/png')
      setArt({ rice: make(0, 0), fish: make(1, 0), egg: make(3, 0), cuke: make(2, 0), corn: make(5, 0), prawn: make(4, 0), onigiri: make(0, 1), bomb: make(10, 0) })
    })
  }, [])
  if (!art) return null
  const q = new URLSearchParams(location.search)
  // /?promo&orbs: the loose orb pictures as data URLs, for building the animated tile on the website.
  if (q.has('orbs')) return <pre id="out" style={{ color: '#000', background: '#fff', whiteSpace: 'pre-wrap' }}>{JSON.stringify(art)}</pre>
  // /?promo&bg: only the scene behind the animated parts.
  const bgOnly = q.has('bg')

  const orb = (src: string, x: number, y: number, size: number, extra: React.CSSProperties = {}) => (
    <img src={src} alt="" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size * 1.3, height: size * 1.3, margin: -size * 0.15, ...extra }} />
  )
  // The chain: three rice orbs climbing to the right, and the dish they become.
  const chain = [[790, 810], [1010, 640], [1210, 470]]
  const dish: [number, number] = [1350, 225]

  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1536, height: 1024, overflow: 'hidden' }}>
      {/* moonlit restaurant, kept soft behind the action */}
      <div style={{ position: 'absolute', left: -250, bottom: -300, width: 1180, opacity: 0.95, filter: 'brightness(0.95) saturate(1.1)' }}>
        <Exterior r={grown()} phase="night" />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 74% 48%, rgba(255,111,145,0.28), rgba(120,60,200,0.18) 38%, rgba(10,4,30,0) 68%), linear-gradient(180deg, rgba(8,3,26,0.5) 0%, rgba(8,3,26,0) 38%)' }} />

      {!bgOnly && <>
      {/* far, soft ingredients for depth */}
      {orb(art.fish, 560, 930, 130, { filter: 'blur(3px)', opacity: 0.75, transform: 'rotate(-14deg)' })}
      {orb(art.cuke, 600, 520, 100, { filter: 'blur(5px)', opacity: 0.6, transform: 'rotate(18deg)' })}
      {orb(art.egg, 1420, 770, 175, { filter: 'blur(2.5px)', opacity: 0.85, transform: 'rotate(10deg)' })}
      {orb(art.corn, 1470, 540, 105, { filter: 'blur(4px)', opacity: 0.65, transform: 'rotate(-20deg)' })}
      {orb(art.prawn, 990, 930, 120, { filter: 'blur(2px)', opacity: 0.8, transform: 'rotate(8deg)' })}

      {/* the glowing chain */}
      <svg style={{ position: 'absolute', inset: 0 }} width="1536" height="1024" viewBox="0 0 1536 1024">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
          <radialGradient id="burst" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff6c8" stopOpacity="0.95" /><stop offset="0.35" stopColor="#ffc86a" stopOpacity="0.6" /><stop offset="1" stopColor="#ff6f91" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={dish[0]} cy={dish[1]} r="330" fill="url(#burst)" />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={dish[0]} y1={dish[1] - 190} x2={dish[0]} y2={dish[1] - 300 - (i % 3) * 36} stroke="#ffe9a0" strokeWidth={i % 2 ? 4 : 7} strokeLinecap="round" opacity="0.75" transform={`rotate(${i * 22.5} ${dish[0]} ${dish[1]})`} />
        ))}
        <path d={`M${chain[0][0]} ${chain[0][1]}L${chain[1][0]} ${chain[1][1]}L${chain[2][0]} ${chain[2][1]}L${dish[0] - 60} ${dish[1] + 90}`} fill="none" stroke="#ff6f91" strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity="0.9" />
        <path d={`M${chain[0][0]} ${chain[0][1]}L${chain[1][0]} ${chain[1][1]}L${chain[2][0]} ${chain[2][1]}`} fill="none" stroke="#ff6f91" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${chain[0][0]} ${chain[0][1]}L${chain[1][0]} ${chain[1][1]}L${chain[2][0]} ${chain[2][1]}`} fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={`M${chain[2][0] + 40} ${chain[2][1] - 40}Q${chain[2][0] + 110} ${chain[2][1] - 150} ${dish[0] - 70} ${dish[1] + 100}`} fill="none" stroke="#ffe9a0" strokeWidth="10" strokeDasharray="2 22" strokeLinecap="round" opacity="0.9" />
      </svg>
      {chain.map(([x, y], i) => orb(art.rice, x, y, 205, { filter: 'drop-shadow(0 0 28px rgba(255,111,145,0.9)) drop-shadow(0 18px 24px rgba(10,0,30,0.6))', transform: `rotate(${(i - 1) * 7}deg) scale(${1 + i * 0.05})` }))}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="1536" height="1024" viewBox="0 0 1536 1024">
        <circle cx={chain[2][0]} cy={chain[2][1]} r="34" fill="#fff" opacity="0.35" />
        <circle cx={chain[2][0]} cy={chain[2][1]} r="20" fill="#fff" stroke="#ff6f91" strokeWidth="6" />
      </svg>

      {/* the dish they make, glowing */}
      {orb(art.onigiri, dish[0], dish[1], 300, { filter: 'drop-shadow(0 0 40px rgba(255,214,120,0.95)) drop-shadow(0 24px 30px rgba(10,0,30,0.55))', transform: 'rotate(-6deg)' })}
      {orb(art.bomb, 1230, 870, 170, { filter: 'drop-shadow(0 0 30px rgba(255,138,42,0.8))', transform: 'rotate(12deg)' })}

      {/* sparkles */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="1536" height="1024" viewBox="0 0 1536 1024">
        {[[1090, 120, 30], [1450, 160, 22], [980, 330, 18], [1480, 420, 26], [760, 520, 20], [1230, 640, 16], [1010, 780, 22], [1400, 960, 18], [610, 640, 14]].map(([x, y, r], i) => (
          <path key={i} d={`M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`} fill="#fff" opacity="0.92" />
        ))}
      </svg>
      </>}
    </main>
  )
}
