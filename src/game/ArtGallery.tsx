import { useEffect, useRef } from 'react'
import { CHAINS } from '../sim/items'
import { loadAllArt, svgUrl } from './art'
import CustomerPortrait, { CUSTOMERS, type CustomerMood } from './Customers'
import { tileCanvas } from './render'

function Plated({ kind, tier }: { kind: number; tier: number }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    void loadAllArt().then(() => {
      const c = tileCanvas(kind, tier, 64, 2)
      c.style.width = `${64 * 1.14}px`
      host.current?.replaceChildren(c)
    })
  }, [kind, tier])
  return <div ref={host} style={{ display: 'inline-block' }} />
}

/** Dev view at /?art for reviewing the illustration set at a glance. */
export default function ArtGallery() {
  return (
    <main className="screen" style={{ maxWidth: 760 }}>
      <h2>Art set</h2>
      <div style={{ background: '#2b1a4a', borderRadius: 16, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {(['idle', 'happy', 'sad'] as CustomerMood[]).flatMap((m) => CUSTOMERS.map((c) => <CustomerPortrait key={c.id + m} customer={c} mood={m} size={110} />))}
      </div>
      <div style={{ background: '#6b2c1c', borderRadius: 16, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[0, 1, 2].flatMap((t) => CHAINS.map((_, k) => <Plated key={`${k}-${t}`} kind={k} tier={t} />))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {CHAINS.flatMap((c, k) =>
          c.names.map((n, t) => (
            <figure key={`${k}-${t}`} style={{ margin: 0, textAlign: 'center' }}>
              <img src={svgUrl(k, t)} alt={n} width={200} height={200} style={{ background: '#f1e6cf', borderRadius: 16 }} />
              <figcaption style={{ fontSize: 13 }}>{n}</figcaption>
            </figure>
          )),
        )}
      </div>
    </main>
  )
}
