import Exterior from './Exterior'
import { grown } from './ExteriorLab'
import Mascot from './Mascot'

/** The picture shown when the link is shared (chat apps, social posts). Captured at /?og, 1200x630. */
export default function Og() {
  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1200, height: 630, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -75, top: -6, width: 820 }}>
        <Exterior r={grown()} phase="night" />
      </div>
      <div style={{ position: 'absolute', left: 56, top: 74, width: 520, color: '#fff6e0' }}>
        <div style={{ marginBottom: 6 }}>
          <Mascot mood="cheer" size={120} />
        </div>
        <div style={{ fontFamily: "'Mochiy Pop One', 'M PLUS Rounded 1c', sans-serif", fontSize: 98, lineHeight: 1, color: '#ffd9a8', textShadow: '0 4px 0 #8a3a5a, 0 0 40px rgba(255,127,176,0.7)' }}>Bentopia</div>
        <div style={{ fontFamily: "'Mochiy Pop One', 'M PLUS Rounded 1c', sans-serif", fontSize: 44, color: '#6dffc0', margin: '8px 0 18px', textShadow: '0 0 24px rgba(109,255,192,0.8)' }}>Sushi Merge</div>
        <div style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1.3, textShadow: '0 2px 10px rgba(20,5,40,0.8)' }}>Link dishes, fill orders, and build your own night-market restaurant.</div>
      </div>
    </main>
  )
}
