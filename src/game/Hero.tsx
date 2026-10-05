import Exterior from './Exterior'
import { grown } from './ExteriorLab'

/** Marketing still at /?hero, captured at 1536x1024 for the cdblogic.com card. Text sits on the left. */
export default function Hero() {
  return (
    <main style={{ position: 'relative', zIndex: 1, width: 1536, height: 1024, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 40, top: 40, width: 1040 }}>
        <Exterior r={grown()} phase="night" />
      </div>
    </main>
  )
}