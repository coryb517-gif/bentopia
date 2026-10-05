import { useRef, type ReactNode } from 'react'
import CustomerPortrait, { CUSTOMERS } from './Customers'
import { DECOR, OL, P } from './iso'
import { canPlace, footprint, itemDef, seats, type FloorId, type ItemType, type Restaurant, type WallId } from './restaurant'

const WALL_H = 124
const SLAB = 14

const WALL_COLORS: Record<WallId, { left: string; right: string; trim: string; panel: string }> = {
  cream: { left: '#f6e8cf', right: '#e8d5b2', trim: '#b98a55', panel: 'rgba(150,100,50,0.22)' },
  indigo: { left: '#454aa6', right: '#343887', trim: '#241f55', panel: 'rgba(255,255,255,0.12)' },
  matcha: { left: '#a9d083', right: '#8fb86b', trim: '#5e7d3e', panel: 'rgba(40,80,20,0.2)' },
  sakura: { left: '#ffd6e2', right: '#f3b8cb', trim: '#c27a92', panel: 'rgba(160,60,90,0.18)' },
}

/** Shared gradients, filters and glows. Safe to render in several SVGs. */
export function RoomDefs() {
  return (
    <defs>
      <radialGradient id="glowWarm"><stop offset="0" stopColor="#ffb347" stopOpacity="0.62" /><stop offset="1" stopColor="#ff8a3d" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowPink"><stop offset="0" stopColor="#ff7fc0" stopOpacity="0.55" /><stop offset="1" stopColor="#ff7fc0" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowCyan"><stop offset="0" stopColor="#7fe6ff" stopOpacity="0.6" /><stop offset="1" stopColor="#7fe6ff" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowGold"><stop offset="0" stopColor="#ffd45e" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd45e" stopOpacity="0" /></radialGradient>
      <linearGradient id="water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8fe9ff" /><stop offset="1" stopColor="#3f9fd8" /></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#140c45" /><stop offset="0.6" stopColor="#4b2a8a" /><stop offset="1" stopColor="#c0508a" /></linearGradient>
      <linearGradient id="door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe3a0" /><stop offset="1" stopColor="#ff9a5a" /></linearGradient>
      <filter id="neon" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <radialGradient id="vignette" cx="0.5" cy="0.55" r="0.75"><stop offset="0.55" stopColor="#0d0626" stopOpacity="0" /><stop offset="1" stopColor="#0d0626" stopOpacity="0.5" /></radialGradient>
    </defs>
  )
}

/** One catalogue item on its own, for shop cards. */
export function DecorPreview({ type, size = 84 }: { type: ItemType; size?: number }) {
  const d = DECOR[type]
  const [, , w, h] = d.view.split(' ').map(Number)
  return (
    <svg viewBox={d.view} width={size * (w / h)} height={size} aria-hidden>
      <RoomDefs />
      {d.art()}
    </svg>
  )
}

function floorTile(floor: FloorId, gx: number, gy: number): ReactNode {
  const pts = [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)].map((p) => p.join(',')).join(' ')
  const alt = (gx + gy) % 2 === 0
  const key = `${gx}-${gy}`
  const inset = (k: number) => [P(gx + k, gy + k), P(gx + 1 - k, gy + k), P(gx + 1 - k, gy + 1 - k), P(gx + k, gy + 1 - k)].map((p) => p.join(',')).join(' ')
  if (floor === 'wood') {
    const lines = [0.33, 0.66].map((v) => `M${P(gx, gy + v).join(',')}L${P(gx + 1, gy + v).join(',')}`).join('')
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#ebc790' : '#e2ba7e'} stroke="rgba(80,40,10,0.35)" strokeWidth="1" />
        <path d={lines} stroke="rgba(120,70,25,0.3)" strokeWidth="1" fill="none" />
      </g>
    )
  }
  if (floor === 'tatami') {
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#b9d17a' : '#aac56b'} stroke="#efe4c2" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${P(gx + 0.5, gy).join(',')}L${P(gx + 0.5, gy + 1).join(',')}`} stroke="rgba(90,120,40,0.35)" strokeWidth="1" />
      </g>
    )
  }
  if (floor === 'stone') {
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#8d8ca6' : '#9998b2'} stroke="rgba(30,20,50,0.4)" strokeWidth="1" />
        <polygon points={inset(0.1)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <circle cx={P(gx + 0.3, gy + 0.6)[0]} cy={P(gx + 0.3, gy + 0.6)[1]} r="1.2" fill="rgba(255,255,255,0.25)" />
      </g>
    )
  }
  return (
    <g key={key}>
      <polygon points={pts} fill={alt ? '#d9473f' : '#fff0d8'} stroke="rgba(60,20,30,0.35)" strokeWidth="1" />
      <polygon points={inset(0.08)} fill="none" stroke={alt ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
    </g>
  )
}

function Lantern({ u, v, hue = 0 }: { u: number; v: number; hue?: number }) {
  const c = [['#ff7a45', '#c23a24'], ['#ffd45e', '#d98a00'], ['#ff8fb0', '#c2456f']][hue % 3]
  return (
    <g className="sway" style={{ transformOrigin: `${u}px ${v + 10}px`, animationDelay: `${-u / 40}s` }}>
      <circle cx={u} cy={v - 4} r="15" fill="url(#glowWarm)" className="flick" />
      <line x1={u} y1={v + 10} x2={u} y2={v + 3} stroke={OL} strokeWidth="1.4" />
      <ellipse cx={u} cy={v - 4} rx="6.4" ry="8" fill={c[0]} stroke={OL} strokeWidth="1.8" />
      <ellipse cx={u - 2} cy={v - 6} rx="1.8" ry="3.4" fill="#fff" opacity="0.55" />
      <rect x={u - 3} y={v - 13} width="6" height="2.4" rx="1" fill={c[1]} stroke={OL} strokeWidth="1" />
    </g>
  )
}

function Walls({ N, wall }: { N: number; wall: WallId }) {
  const col = WALL_COLORS[wall]
  const len = N * 32
  const [ox, oy] = P(0, 0)
  const lw = (g: ReactNode) => <g transform={`matrix(-1 0.5 0 -1 ${ox} ${oy})`}>{g}</g>
  const rw = (g: ReactNode) => <g transform={`matrix(1 0.5 0 -1 ${ox} ${oy})`}>{g}</g>
  const panelLines = (fill: string) =>
    Array.from({ length: Math.floor(len / 32) + 1 }, (_, i) => <line key={i} x1={i * 32} y1={30} x2={i * 32} y2={WALL_H - 8} stroke={fill} strokeWidth="1.4" />)
  const winW = Math.min(132, len - 76)
  const winU = (len - winW) / 2 + 6
  const doorU = len * 0.5 - 22

  const wallBody = (fill: string) => (
    <>
      <rect x={0} y={0} width={len} height={WALL_H} fill={fill} stroke={OL} strokeWidth="2.6" strokeLinejoin="round" />
      {panelLines(col.panel)}
      <line x1="0" y1="52" x2={len} y2="52" stroke={col.panel} strokeWidth="1.4" />
      <rect x={0} y={0} width={len} height={30} fill={col.trim} opacity="0.85" />
      <line x1="0" y1="30" x2={len} y2="30" stroke={OL} strokeWidth="2" />
      <rect x={0} y={WALL_H - 8} width={len} height={8} fill="#4b2f20" stroke={OL} strokeWidth="2" />
      <rect x={0} y={0} width={len} height={5} fill="#2e1c14" opacity="0.5" />
    </>
  )

  return (
    <g>
      {lw(
        <>
          {wallBody(col.left)}
          {/* window onto the night market */}
          <g>
            <rect x={winU} y={50} width={winW} height={60} fill="url(#sky)" stroke="#5a3a22" strokeWidth="5" strokeLinejoin="round" />
            <circle cx={winU + winW * 0.72} cy={92} r="12" fill="#fff3c4" opacity="0.35" />
            <circle cx={winU + winW * 0.72} cy={92} r="8" fill="#fff8e0" />
            {[0.12, 0.3, 0.5, 0.88].map((f, i) => (
              <circle key={i} cx={winU + winW * f} cy={98 + (i % 2) * 6} r="1.2" fill="#fff" opacity="0.8" />
            ))}
            <path d={`M${winU + 2} 56V62h14V70h10V60h10v8h12V64h12V74h14V62h10v10h10V66h8V56Z`} fill="#1a0e3b" opacity="0.92" transform={`translate(0 0)`} />
            {[14, 38, 62, 88, 108].map((x, i) => (
              <rect key={i} x={winU + x} y={56 + (i % 3) * 3} width="3" height="3.5" fill="#ffcf6b" className="flick" style={{ animationDelay: `${-i}s` }} />
            ))}
            <line x1={winU + winW / 3} y1="50" x2={winU + winW / 3} y2="110" stroke="#5a3a22" strokeWidth="3" />
            <line x1={winU + (winW * 2) / 3} y1="50" x2={winU + (winW * 2) / 3} y2="110" stroke="#5a3a22" strokeWidth="3" />
            <line x1={winU} y1="80" x2={winU + winW} y2="80" stroke="#5a3a22" strokeWidth="3" />
            <rect x={winU - 4} y={46} width={winW + 8} height="5" fill="#7a4e30" stroke={OL} strokeWidth="1.8" />
          </g>
          <path d={`M4 ${WALL_H - 14}Q${len / 2} ${WALL_H - 30} ${len - 4} ${WALL_H - 14}`} fill="none" stroke="rgba(42,15,46,0.7)" strokeWidth="1.4" />
          {[len * 0.18, len * 0.5, len * 0.82].map((u, i) => (
            <Lantern key={i} u={u} v={WALL_H - 28 + (i === 1 ? 4 : 0)} hue={i} />
          ))}
        </>,
      )}
      {rw(
        <>
          {wallBody(col.right)}
          {/* street door with a noren curtain */}
          <rect x={doorU} y={0} width={44} height={88} fill="url(#door)" stroke={OL} strokeWidth="3" />
          <rect x={doorU - 4} y={0} width={52} height={92} fill="none" stroke="#5a3a22" strokeWidth="5" />
          <rect x={doorU - 7} y={88} width={58} height={7} fill="#7a4e30" stroke={OL} strokeWidth="1.8" />
          {[0, 1, 2].map((i) => (
            <g key={i} className="sway" style={{ transformOrigin: `${doorU + 7 + i * 15}px 86px`, animationDelay: `${-i * 0.5}s` }}>
              <rect x={doorU + i * 15 + 1} y={46} width="13" height="40" rx="1.5" fill="#2c3a8f" stroke={OL} strokeWidth="1.8" />
              <circle cx={doorU + i * 15 + 7.5} cy={64} r="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
            </g>
          ))}
          <rect x={doorU - 2} y={84} width={48} height="4" fill="#4b2f20" stroke={OL} strokeWidth="1.4" />
          <path d={`M4 ${WALL_H - 14}Q${len / 2} ${WALL_H - 30} ${len - 4} ${WALL_H - 14}`} fill="none" stroke="rgba(42,15,46,0.7)" strokeWidth="1.4" />
          {[len * 0.16, len * 0.84].map((u, i) => (
            <Lantern key={i} u={u} v={WALL_H - 28} hue={i + 1} />
          ))}
        </>,
      )}
    </g>
  )
}

export interface Ghost {
  type: ItemType
  gx: number
  gy: number
  ignoreId?: number
}

export interface RoomProps {
  r: Restaurant
  grid: number
  /** Show the tile grid and block item taps (placing mode). */
  placing?: Ghost | null
  selectedId?: number | null
  onTile?: (gx: number, gy: number) => void
  onItem?: (id: number) => void
  /** Pointer hover over a tile (mouse only). */
  onHover?: (gx: number, gy: number) => void
}

export default function Room({ r, grid, placing, selectedId, onTile, onItem, onHover }: RoomProps) {
  const svg = useRef<SVGSVGElement>(null)
  const minX = -grid * 32 - 14
  const width = grid * 64 + 28
  const minY = -WALL_H - 26
  const height = WALL_H + grid * 32 + SLAB + 56

  const tileAt = (e: React.PointerEvent): [number, number] | null => {
    const el = svg.current
    if (!el) return null
    const m = el.getScreenCTM()
    if (!m) return null
    const pt = el.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(m.inverse())
    const gx = Math.floor((p.x / 32 + p.y / 16) / 2)
    const gy = Math.floor((p.y / 16 - p.x / 32) / 2)
    return gx >= 0 && gy >= 0 && gx < grid && gy < grid ? [gx, gy] : null
  }

  const drawables: { key: number; node: ReactNode }[] = []
  const diners = seats(r).slice(0, 6)
  r.items.forEach((p) => {
    const def = itemDef(p.type)
    const base = p.gx + p.gy + def.w + def.d
    const art = DECOR[p.type].art()
    const [sx, sy] = P(p.gx, p.gy)
    drawables.push({
      key: base,
      node: (
        <g
          key={`i${p.id}`}
          transform={`translate(${sx} ${sy})`}
          style={{ cursor: !placing && onItem ? 'pointer' : undefined, pointerEvents: placing ? 'none' : 'auto' }}
          onPointerUp={(e) => {
            if (placing || !onItem) return
            e.stopPropagation()
            onItem(p.id)
          }}
        >
          {art}
        </g>
      ),
    })
  })
  diners.forEach((s, i) => {
    const it = r.items.find((p) => p.id === s.itemId)!
    const def = itemDef(it.type)
    const who = CUSTOMERS[i % CUSTOMERS.length]
    let lx = s.gx + 0.5
    let ly = s.gy + 0.5
    let lz = 24
    let key = s.gx + s.gy + def.w + def.d + 0.4
    if (it.type === 'table') {
      lx = s.gx + (s.slot === 0 ? 0.06 : 0.94)
      lz = 14
      key += s.slot === 0 ? -0.8 : 0.4
    } else if (it.type === 'counter') {
      lx = s.gx + 0.5 + s.slot
      ly = s.gy + 1.18
      lz = 18
    }
    const [px, py] = P(lx, ly, lz)
    drawables.push({
      key,
      node: (
        <g key={`c${i}`} transform={`translate(${px - 21} ${py - 40})`} pointerEvents="none">
          <ellipse cx="21" cy="42" rx="15" ry="5" fill="rgba(18,4,36,0.3)" />
          <CustomerPortrait customer={who} mood="happy" size={42} />
          <path className="steam" style={{ animationDelay: `${-i * 0.7}s` }} d="M30 6q-3 -4 0 -8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </g>
      ),
    })
  })
  drawables.sort((a, b) => a.key - b.key)

  const diamond = (gx: number, gy: number, w = 1, d = 1) =>
    [P(gx, gy), P(gx + w, gy), P(gx + w, gy + d), P(gx, gy + d)].map((p) => p.join(',')).join(' ')

  const selected = selectedId ? r.items.find((p) => p.id === selectedId) : null
  const ghostOk = placing ? canPlace(r, placing.type, placing.gx, placing.gy, grid, placing.ignoreId) : false

  return (
    <svg
      ref={svg}
      className="room"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
      aria-label="Your restaurant"
      onPointerUp={(e) => {
        const t = tileAt(e)
        if (t && onTile) onTile(t[0], t[1])
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !onHover) return
        const t = tileAt(e)
        if (t) onHover(t[0], t[1])
      }}
    >
      <RoomDefs />
      <Walls N={grid} wall={r.wall} />
      {/* floor slab and tiles */}
      <polygon points={[P(0, grid), P(grid, grid), P(grid, grid, -SLAB), P(0, grid, -SLAB)].map((p) => p.join(',')).join(' ')} fill="#7a4e30" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points={[P(grid, 0), P(grid, grid), P(grid, grid, -SLAB), P(grid, 0, -SLAB)].map((p) => p.join(',')).join(' ')} fill="#5f3a24" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      <g>{Array.from({ length: grid * grid }, (_, i) => floorTile(r.floor, Math.floor(i / grid), i % grid))}</g>
      <polygon points={[P(0, 0), P(grid, 0), P(grid, grid), P(0, grid)].map((p) => p.join(',')).join(' ')} fill="none" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      {/* light pools */}
      <g style={{ mixBlendMode: 'screen' }} pointerEvents="none">
        {r.items.map((p) => {
          const g = DECOR[p.type].glow
          return g ? (
            <g key={p.id} transform={`translate(${P(p.gx, p.gy)[0]} ${P(p.gx, p.gy)[1]})`}>
              {g()}
            </g>
          ) : null
        })}
      </g>
      {/* decorate-mode guides */}
      {placing && (
        <g pointerEvents="none">
          {Array.from({ length: grid * grid }, (_, i) => (
            <polygon key={i} points={diamond(Math.floor(i / grid), i % grid)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="3 3" />
          ))}
        </g>
      )}
      {selected && (
        <polygon className="selpulse" pointerEvents="none" points={diamond(selected.gx, selected.gy, itemDef(selected.type).w, itemDef(selected.type).d)} fill="rgba(255,210,58,0.28)" stroke="#ffd23a" strokeWidth="3" strokeLinejoin="round" />
      )}
      {placing &&
        footprint(placing.type, placing.gx, placing.gy).map(([x, y]) => (
          <polygon key={`${x}${y}`} pointerEvents="none" points={diamond(x, y)} fill={ghostOk ? 'rgba(109,255,192,0.4)' : 'rgba(255,91,110,0.4)'} stroke={ghostOk ? '#6dffc0' : '#ff5b6e'} strokeWidth="2.4" strokeLinejoin="round" />
        ))}
      {drawables.map((d) => d.node)}
      {placing && (
        <g transform={`translate(${P(placing.gx, placing.gy)[0]} ${P(placing.gx, placing.gy)[1]})`} opacity={ghostOk ? 0.8 : 0.45} pointerEvents="none">
          {DECOR[placing.type].art()}
        </g>
      )}
    </svg>
  )
}
