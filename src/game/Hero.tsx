import Room from './Room'
import { full } from './RoomLab'

/** Marketing still at /?hero, captured at 1536x1024 for the cdblogic.com card. Text sits on the left. */
export default function Hero() {
  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1536, height: 1024, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -10, top: 150, width: 1000 }}>
        <Room r={full} grid={7} />
      </div>
    </main>
  )
}