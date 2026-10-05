import { useEffect, useRef, useState, type ReactNode } from 'react'

interface T {
  s: number
  x: number
  y: number
}

const MIN = 1
const MAX = 3.2

/**
 * Pinch, drag and wheel zoom for a big room. Taps still pass through to whatever is underneath;
 * only a real drag pans, and that drag is swallowed so it does not place or select things.
 */
export default function ZoomPan({ children, resetKey, className = '' }: { children: ReactNode; resetKey?: string | number; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<T>({ s: 1, x: 0, y: 0 })
  const tRef = useRef(t)
  tRef.current = t
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; s: number; moved: boolean; lastX: number; lastY: number } | null>(null)
  const dragged = useRef(false)

  const clamp = (n: T): T => {
    const el = box.current
    if (!el) return n
    const w = el.clientWidth
    const h = el.clientHeight
    const s = Math.min(MAX, Math.max(MIN, n.s))
    return { s, x: Math.min(0, Math.max(w - w * s, n.x)), y: Math.min(0, Math.max(h - h * s, n.y)) }
  }

  /** Zoom to scale `s` keeping the point (cx, cy), in box coordinates, fixed. */
  const zoomAt = (s: number, cx: number, cy: number) => {
    const cur = tRef.current
    const ns = Math.min(MAX, Math.max(MIN, s))
    const k = ns / cur.s
    setT(clamp({ s: ns, x: cx - (cx - cur.x) * k, y: cy - (cy - cur.y) * k }))
  }

  useEffect(() => setT({ s: 1, x: 0, y: 0 }), [resetKey])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(tRef.current.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, local(e))
    dragged.current = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: tRef.current.s, moved: true, lastX: 0, lastY: 0 }
      dragged.current = true
    } else {
      const p = local(e)
      gesture.current = { dist: 0, s: tRef.current.s, moved: false, lastX: p.x, lastY: p.y }
    }
  }

  const onMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || !pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (g.dist > 0) zoomAt(g.s * (dist / g.dist), (a.x + b.x) / 2, (a.y + b.y) / 2)
      return
    }
    const dx = p.x - g.lastX
    const dy = p.y - g.lastY
    if (!g.moved && Math.hypot(dx, dy) < 7) return
    if (tRef.current.s <= MIN + 0.01) return // nothing to pan at fit zoom
    if (!g.moved) {
      g.moved = true
      box.current?.setPointerCapture(e.pointerId)
    }
    dragged.current = true
    g.lastX = p.x
    g.lastY = p.y
    setT(clamp({ ...tRef.current, x: tRef.current.x + dx, y: tRef.current.y + dy }))
  }

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) gesture.current = null
  }

  const fit = () => setT({ s: 1, x: 0, y: 0 })
  const center = () => ({ cx: (box.current?.clientWidth ?? 0) / 2, cy: (box.current?.clientHeight ?? 0) / 2 })

  return (
    <div
      ref={box}
      className={`zp ${className}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerUpCapture={(e) => {
        // A drag or pinch is not a tap: keep it from reaching the room underneath.
        if (dragged.current) {
          e.stopPropagation()
          dragged.current = false
        }
      }}
    >
      <div className="zp-content" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transformOrigin: '0 0' }}>{children}</div>
      <div className="zp-tools" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <button aria-label="Zoom in" onClick={() => { const c = center(); zoomAt(t.s * 1.4, c.cx, c.cy) }}>+</button>
        <button aria-label="Zoom out" onClick={() => { const c = center(); zoomAt(t.s / 1.4, c.cx, c.cy) }}>−</button>
        {t.s > 1.01 && <button aria-label="Fit room" onClick={fit}>⤢</button>}
      </div>
    </div>
  )
}
