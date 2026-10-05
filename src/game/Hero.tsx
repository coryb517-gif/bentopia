import { useEffect, useRef } from 'react'
import { loadAllArt } from './art'
import Mascot from './Mascot'
import { tileCanvas } from './render'

const GRID = [
  [0, 1, 2, 3],
  [4, 5, 0, 1],
  [2, 3, 4, 5],
]

function Orb({ kind, tier, size }: { kind: number; tier: number; size: number }) {
  const host = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    void loadAllArt().then(() => {
      const c = tileCanvas(kind, tier, size, 2)
      c.style.width = `${size * 1.3}px`
      host.current?.replaceChildren(c)
    })
  }, [kind, tier, size])
  return <span ref={host} style={{ display: 'inline-block', margin: -size * 0.15 }} />
}

/** Marketing still at /?hero, captured at 1536x1024 for the cdblogic.com card. Text sits on the left. */
export default function Hero() {
  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1536, height: 1024, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 70, top: 150, display: 'grid', gap: 0, transform: 'rotate(-4deg)' }}>
        {GRID.map((row, r) => (
          <div key={r} style={{ display: 'flex', marginLeft: r % 2 ? 60 : 0 }}>
            {row.map((k, i) => (
              <Orb key={i} kind={k} tier={r === 1 && i === 1 ? 2 : r === 2 && i === 3 ? 1 : 0} size={150} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 760, top: 650 }}>
        <Mascot mood="cheer" size={250} />
      </div>
    </main>
  )
}
