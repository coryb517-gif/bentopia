import { useEffect, useState } from 'react'
import Mascot, { type Mood } from './Mascot'

interface Props {
  /** CSS selector of the element to spotlight. Without one, the coach is a centred card. */
  target?: string
  text: string
  side?: 'above' | 'below'
  /** Dim everything except the target. */
  dim?: boolean
  mood?: Mood
  onDismiss?: () => void
  dismissLabel?: string
  onSkip?: () => void
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** A mascot bubble that points at a real element, so the lesson happens on the actual screen. */
export default function Coach({ target, text, side = 'above', dim = true, mood = 'cheer', onDismiss, dismissLabel = 'Got it', onSkip }: Props) {
  const [box, setBox] = useState<Box | null>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })

  // Track the target while layouts settle and animate.
  useEffect(() => {
    if (!target) {
      setBox(null)
      return
    }
    const read = () => {
      const el = document.querySelector(target)
      setVp({ w: window.innerWidth, h: window.innerHeight })
      if (!el) return setBox(null)
      const r = el.getBoundingClientRect()
      setBox((prev) => (prev && Math.abs(prev.x - r.x) < 0.5 && Math.abs(prev.y - r.y) < 0.5 && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5 ? prev : { x: r.x, y: r.y, w: r.width, h: r.height }))
    }
    read()
    const id = setInterval(read, 150)
    window.addEventListener('resize', read)
    return () => {
      clearInterval(id)
      window.removeEventListener('resize', read)
    }
  }, [target])

  const bubbleW = Math.min(340, vp.w - 24)
  const bubble = (
    <div className="coach-bubble" style={{ width: bubbleW }}>
      <Mascot mood={mood} size={58} />
      <div className="coach-text">
        <p>{text}</p>
        <div className="coach-actions">
          {onDismiss && <button className="btn primary" onClick={onDismiss}>{dismissLabel}</button>}
          {onSkip && <button className="coach-skip" onClick={onSkip}>Skip tutorial</button>}
        </div>
      </div>
    </div>
  )

  if (!target || !box) {
    // No target (intro, or the target is not on screen yet): a centred card.
    if (target && !box) return null
    return (
      <div className="coach-center" role="dialog" aria-modal="true">
        {bubble}
      </div>
    )
  }

  const pad = 8
  const ring = { left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 }
  const above = side === 'above' ? box.y > 190 : box.y + box.h > vp.h - 190
  const left = Math.max(12, Math.min(vp.w - bubbleW - 12, box.x + box.w / 2 - bubbleW / 2))
  const tail = Math.max(24, Math.min(bubbleW - 24, box.x + box.w / 2 - left))
  const style = above
    ? { left, bottom: vp.h - box.y + pad + 14 }
    : { left, top: box.y + box.h + pad + 14 }

  return (
    <div className="coach-layer" aria-live="polite">
      <div className={`coach-ring${dim ? ' dim' : ''}`} style={ring} />
      <div className={`coach-pos ${above ? 'above' : 'below'}`} style={style}>
        {bubble}
        <i className="coach-tail" style={{ left: tail }} />
      </div>
    </div>
  )
}
