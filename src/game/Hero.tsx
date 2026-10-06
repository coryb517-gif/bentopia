import Exterior from './Exterior'
import { grown } from './ExteriorLab'
import { neighbourRestaurant } from './neighbours'
import Room from './Room'
import { autoArrange } from './layout'

/** Marketing still at /?hero, captured at 1536x1024 for the cdblogic.com card. Text sits on the left. */
export default function Hero() {
  const raw = neighbourRestaurant(3, 11)
  const inside = autoArrange(raw, raw.size ?? 7, 'balanced') ?? raw
  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1536, height: 1024, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 20, top: 10, width: 960 }}>
        <Exterior r={grown()} phase="night" />
      </div>
      <div style={{ position: 'absolute', right: 30, bottom: -20, width: 700, filter: 'drop-shadow(0 18px 30px rgba(10,0,30,0.55))' }}>
        <Room r={inside} grid={inside.size ?? 7} phase="night" live={false} />
      </div>
    </main>
  )
}
