import { useEffect, useState, type ReactNode } from 'react'
import CustomerPortrait, { CUSTOMERS } from './Customers'
import { Box, FaceX, FaceY, OL, P, type Tri } from './iso'
import { floorArt, floorTile, phaseOf, RoomDefs, SKY, type Phase } from './Room'
import { itemDef, restaurantName, seatTotal, sizeOf, type Placed, type Restaurant } from './restaurant'

/** One storey is 74px tall, with a 6px cornice on top. */
const H = 74
const CORN = 6

const PLASTER: Tri = ['#f3e6cc', '#f0e0c0', '#d8c29d']
const TIMBER: Tri = ['#8a5b38', '#6e4429', '#52301c']
const TILE: Tri = ['#51628a', '#3f4f78', '#2f3d62']

const poly = (pts: [number, number][], fill: string, stroke = OL, sw = 2.2) => (
  <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
)
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** A lit paper window. `glow` is how brightly it shines (night 1, day low); `peek` puts a diner in it. */
function Win({ u, v, w = 22, h = 30, glow, peek = -1 }: { u: number; v: number; w?: number; h?: number; glow: number; peek?: number }) {
  return (
    <g>
      <rect x={u - 2} y={v - 2} width={w + 4} height={h + 4} rx="1.5" fill="#4b2f20" stroke={OL} strokeWidth="1.4" />
      <rect x={u} y={v} width={w} height={h} fill="#cfe3f3" />
      <rect x={u} y={v} width={w} height={h} fill="url(#winLit)" opacity={0.25 + glow * 0.75} />
      {peek >= 0 && (
        <g className="silbob" style={{ animationDelay: `${-peek * 0.8}s` }}>
          <circle cx={u + w * 0.5} cy={v + h * 0.34} r={w * 0.17} fill="#3a2430" />
          <path d={`M${u + w * 0.2} ${v} q${w * 0.3} ${h * 0.46} ${w * 0.6} 0z`} fill="#3a2430" />
        </g>
      )}
      <line x1={u + w / 2} y1={v} x2={u + w / 2} y2={v + h} stroke="#8a5a3a" strokeWidth="1.2" />
      <line x1={u} y1={v + h / 2} x2={u + w} y2={v + h / 2} stroke="#8a5a3a" strokeWidth="1.2" />
      <rect x={u} y={v} width={w} height={h} fill="url(#glassShine)" pointerEvents="none" />
    </g>
  )
}

/** A hip roof over a rectangle, with tile courses and a gold finial. */
export function HipRoof({ x, y, w, d, z, rh = 40, over = 0.3, c = TILE }: { x: number; y: number; w: number; d: number; z: number; rh?: number; over?: number; c?: Tri }) {
  const apex = P(x + w / 2, y + d / 2, z + rh)
  const l = [P(x - over, y + d + over, z), P(x + w + over, y + d + over, z)] as [number, number][]
  const r = [P(x + w + over, y - over, z), P(x + w + over, y + d + over, z)] as [number, number][]
  const courses = (a: [number, number], b: [number, number]) =>
    [0.22, 0.42, 0.62, 0.8].map((t) => <line key={t} x1={lerp(a, apex, t)[0]} y1={lerp(a, apex, t)[1]} x2={lerp(b, apex, t)[0]} y2={lerp(b, apex, t)[1]} stroke="rgba(15,10,40,0.45)" strokeWidth="1.2" />)
  return (
    <g>
      {poly([l[0], l[1], apex], c[1])}
      {courses(l[0], l[1])}
      {poly([r[0], r[1], apex], c[2])}
      {courses(r[0], r[1])}
      <path d={`M${l[0][0]} ${l[0][1]}L${l[1][0]} ${l[1][1]}L${r[0][0]} ${r[0][1]}`} fill="none" stroke="#d9b45a" strokeWidth="2.4" strokeLinejoin="round" />
      <path d={`M${apex[0]} ${apex[1] + 2}L${apex[0]} ${apex[1] - 9}`} stroke={OL} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${apex[0]} ${apex[1] + 2}L${apex[0]} ${apex[1] - 9}`} stroke="#ffd45e" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

function Lantern({ x, y, glow, s = 1 }: { x: number; y: number; glow: number; s?: number }) {
  return (
    <g className="sway" style={{ transformOrigin: `${x}px ${y - 12 * s}px` }}>
      <circle cx={x} cy={y} r={20 * s} fill="url(#glowWarm)" opacity={glow} className="flick" />
      <line x1={x} y1={y - 12 * s} x2={x} y2={y - 8 * s} stroke={OL} strokeWidth="1.4" />
      <ellipse cx={x} cy={y} rx={6.4 * s} ry={8.4 * s} fill="#ff7a45" stroke={OL} strokeWidth="1.8" />
      <ellipse cx={x - 2 * s} cy={y - 2 * s} rx={1.8 * s} ry={3.4 * s} fill="#fff" opacity="0.55" />
    </g>
  )
}

interface NeighborSpec {
  x: number
  y: number
  w: number
  d: number
  floors: number
  wall: Tri
  roof: Tri
  sign: string
  neon: string
}

/** A shop next door: a smaller building in the same style. */
function Neighbor({ s, glow }: { s: NeighborSpec; glow: number }) {
  const h = s.floors * (H - 10)
  const tiles = Math.floor(s.w)
  return (
    <g>
      <Box x={s.x} y={s.y} w={s.w} d={s.d} h={h} c={s.wall} />
      <Box x={s.x - 0.12} y={s.y - 0.12} w={s.w + 0.24} d={s.d + 0.24} h={4} z={h} c={TIMBER} sw={1.8} />
      <HipRoof x={s.x} y={s.y} w={s.w} d={s.d} z={h + 4} rh={26} over={0.22} c={s.roof} />
      <FaceY x={s.x} y={s.y + s.d} z={0}>
        <rect x="0" y="0" width={s.w * 32} height="14" fill="#2c2234" />
        {Array.from({ length: tiles }, (_, i) =>
          Array.from({ length: s.floors }, (_, f) => (
            <Win key={`${i}-${f}`} u={i * 32 + 6} v={22 + f * (H - 10)} w={20} h={26} glow={glow} peek={(i + f) % 3 === 0 ? i : -1} />
          )),
        )}
        <rect x={s.w * 16 - 26} y="52" width="52" height="11" rx="2" fill="#150f2a" stroke={OL} strokeWidth="1.4" />
        <g transform="scale(1 -1)" className="flick" style={{ filter: 'url(#neon)' }}>
          <text x={s.w * 16} y="-59.4" textAnchor="middle" fontSize="7.4" fontWeight="800" fontFamily="'Mochiy Pop One', sans-serif" fill={s.neon}>{s.sign}</text>
        </g>
      </FaceY>
    </g>
  )
}

interface Props {
  r: Restaurant
  /** Force a time of day (stills); otherwise the player's clock decides. */
  phase?: Phase
  /** Tapped the building: go inside. */
  onEnter?: () => void
}

export default function Exterior({ r, phase: forced, onEnter }: Props) {
  const [phase, setPhase] = useState<Phase>(() => forced ?? phaseOf())
  useEffect(() => {
    if (forced) return setPhase(forced)
    const id = setInterval(() => setPhase(phaseOf()), 60_000)
    return () => clearInterval(id)
  }, [forced])
  const glow = SKY[phase].glow
  const lit = phase === 'day' ? 0.12 : phase === 'dawn' ? 0.55 : 1

  const N = sizeOf(r, 'ground')
  const hasUp = !!r.upstairs
  const U = hasUp ? Math.min(r.upstairs!.size, N) : 0
  const topS = hasUp ? U : N
  const zGround = H + CORN
  const zTop = hasUp ? zGround + H + CORN : zGround
  const roof = r.rooftop
  const R = roof ? Math.min(roof.size, topS) : 0
  const seats = seatTotal(r)
  const queue = Math.min(7, Math.ceil(seats / 3))
  const [nameTop, nameBottom] = restaurantName(r)
  const door = Math.floor(N / 2)
  const upSeats = r.upstairs ? r.upstairs.items.reduce((n, p) => n + itemDef(p.type).seats, 0) : 0

  // framing: the building plus a slice of street either side
  const minX = -(N + 2.6) * 32 - 40
  const maxX = (N + 3.6) * 32 + 40
  const minY = -(zTop + (roof ? 96 : 84)) - 24
  const maxY = (N + 1.9) * 32 + 40

  const neighbors: NeighborSpec[] = [
    { x: -5.2, y: 0.4, w: 4.2, d: 4, floors: 2, wall: ['#e8d6b4', '#e3cfa8', '#c9b087'], roof: ['#7a4a52', '#613b44', '#4a2c34'], sign: 'TEA', neon: '#6dffc0' },
    { x: N + 2.5, y: 0.6, w: 4, d: 3.6, floors: 1, wall: ['#f0dcc0', '#ead4b4', '#cdb08c'], roof: ['#4a6a5a', '#3a5848', '#2c4538'], sign: 'RAMEN', neon: '#ff7fc0' },
  ]

  const ring: ReactNode =
    hasUp && U < N ? (
      <g>
        {poly([P(U, 0, zGround), P(N, 0, zGround), P(N, N, zGround), P(U, N, zGround)], TILE[1])}
        {poly([P(0, U, zGround), P(U, U, zGround), P(U, N, zGround), P(0, N, zGround)], TILE[0])}
      </g>
    ) : null

  const rooftopItems: Placed[] = roof ? [...roof.items].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)) : []
  const rugs = rooftopItems.filter((p) => itemDef(p.type).layer === 'rug')
  const things = rooftopItems.filter((p) => itemDef(p.type).layer === 'floor')

  const street = (
    <g>
      <polygon points={[P(-9, -6), P(N + 10, -6), P(N + 10, N + 8), P(-9, N + 8)].map((p) => p.join(',')).join(' ')} fill="#2b2147" />
      <polygon points={[P(-9, N + 1.4), P(N + 10, N + 1.4), P(N + 10, N + 4.2), P(-9, N + 4.2)].map((p) => p.join(',')).join(' ')} fill="#3a2f5c" />
      <polygon points={[P(N + 1.4, -6), P(N + 2.5, -6), P(N + 2.5, N + 8), P(N + 1.4, N + 8)].map((p) => p.join(',')).join(' ')} fill="#3a2f5c" />
      <path d={`M${P(-9, N + 2.8).join(',')}L${P(N + 10, N + 2.8).join(',')}`} stroke="rgba(255,236,170,0.5)" strokeWidth="2" strokeDasharray="12 10" />
      {/* sidewalks */}
      <polygon points={[P(-6, N), P(N + 1.4, N), P(N + 1.4, N + 1.4), P(-6, N + 1.4)].map((p) => p.join(',')).join(' ')} fill="#8a84a6" stroke="rgba(20,10,40,0.5)" strokeWidth="1.4" />
      <polygon points={[P(N, -0.2), P(N + 1.4, -0.2), P(N + 1.4, N)].map((p) => p.join(',')).join(' ')} fill="#8a84a6" />
      <polygon points={[P(N, -3), P(N + 1.4, -3), P(N + 1.4, N + 1.4), P(N, N + 1.4)].map((p) => p.join(',')).join(' ')} fill="#8a84a6" stroke="rgba(20,10,40,0.5)" strokeWidth="1.4" />
      {Array.from({ length: N + 7 }, (_, i) => (
        <line key={i} x1={P(i - 6, N)[0]} y1={P(i - 6, N)[1]} x2={P(i - 6, N + 1.4)[0]} y2={P(i - 6, N + 1.4)[1]} stroke="rgba(20,10,40,0.28)" strokeWidth="1" />
      ))}
      <ellipse cx={P(N * 0.5, N + 0.9)[0]} cy={P(N * 0.5, N + 0.9)[1]} rx={N * 30} ry={N * 11} fill="url(#glowWarm)" opacity={0.5 * glow} style={{ mixBlendMode: 'screen' }} />
    </g>
  )

  // street furniture reuses the interior art at street scale
  const furniture: { type: 'lamp' | 'vending' | 'sakura' | 'bench' | 'stonelantern'; x: number; y: number }[] = [
    { type: 'lamp', x: -0.4, y: N + 0.1 },
    { type: 'lamp', x: N - 0.6, y: N + 0.2 },
    { type: 'sakura', x: N + 0.15, y: N + 0.15 },
    { type: 'vending', x: N + 0.2, y: Math.max(0.6, N - 3.6) },
    { type: 'bench', x: N + 0.1, y: 0.4 },
    { type: 'stonelantern', x: -3.2, y: N + 0.1 },
  ]
  const prop = (f: (typeof furniture)[number]) => {
    const art = floorArt(f.type)
    const [px, py] = P(f.x, f.y)
    return (
      <g key={`${f.type}${f.x}`} transform={`translate(${px} ${py})`} pointerEvents="none">
        {art.glow && <g style={{ mixBlendMode: 'screen' }} opacity={glow}>{art.glow()}</g>}
        {art.art()}
      </g>
    )
  }

  const doorU = (door + 0.5) * 32

  return (
    <svg className="exterior" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img" aria-label={`${nameTop} ${nameBottom}, from the street`}>
      <RoomDefs phase={phase} />
      <defs>
        <linearGradient id="winLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0b8" /><stop offset="1" stopColor="#ff9a4e" /></linearGradient>
        <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.35" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id="extFadeG" cx="0.5" cy="0.55" r="0.62"><stop offset="0.62" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
        <mask id="extFade" maskUnits="userSpaceOnUse" x={minX} y={minY} width={maxX - minX} height={maxY - minY}><rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#extFadeG)" /></mask>
        <linearGradient id="doorGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd890" /><stop offset="1" stopColor="#ff8a4a" /></linearGradient>
      </defs>
      <g mask="url(#extFade)">
      {street}
      <Neighbor s={neighbors[0]} glow={lit} />

      {/* the building: tap it to go inside */}
      <g style={{ cursor: onEnter ? 'pointer' : undefined }} onPointerUp={() => onEnter?.()}>
        <Box x={0} y={0} w={N} d={N} h={H} c={PLASTER} />
        <Box x={-0.16} y={-0.16} w={N + 0.32} d={N + 0.32} h={CORN} z={H} c={TIMBER} />
        {/* ground-floor front (the street side) */}
        <FaceY x={0} y={N} z={0}>
          <rect x="0" y="0" width={N * 32} height="16" fill="#2c2234" />
          {Array.from({ length: N * 4 }, (_, i) => <line key={i} x1={i * 8} y1="0" x2={i * 8} y2="16" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
          {Array.from({ length: N + 1 }, (_, i) => <rect key={i} x={i * 32 - 1.6} y="0" width="3.2" height={H} fill="#6e4429" />)}
          {Array.from({ length: N }, (_, i) => (i === door ? null : <Win key={i} u={i * 32 + 5} v={26} w={22} h={32} glow={lit} peek={i % 2 === 0 ? i : -1} />))}
          <rect x={doorU - 22} y="0" width="44" height="54" rx="2" fill="url(#doorGlow)" stroke={OL} strokeWidth="2.4" />
          <rect x={doorU - 25} y="0" width="50" height="58" fill="none" stroke="#5a3a22" strokeWidth="4" />
          {[0, 1, 2].map((i) => (
            <g key={i} className="sway" style={{ transformOrigin: `${doorU - 14 + i * 14}px 54px`, animationDelay: `${-i * 0.5}s` }}>
              <rect x={doorU - 20 + i * 13.4} y="26" width="12.4" height="28" rx="1.2" fill="#2c3a8f" stroke={OL} strokeWidth="1.5" />
              <circle cx={doorU - 13.8 + i * 13.4} cy="40" r="3.2" fill="none" stroke="#fff" strokeWidth="1.4" />
            </g>
          ))}
          <rect x={doorU - 38} y="60" width="76" height="17" rx="2.4" fill="#5a3a22" stroke={OL} strokeWidth="1.8" />
          <rect x={doorU - 35} y="62.5" width="70" height="12" rx="1.5" fill="#2a1d2e" />
          <g transform="scale(1 -1)">
            <text x={doorU} y="-70.6" textAnchor="middle" fontSize="8.4" fontWeight="800" fontFamily="'Mochiy Pop One', sans-serif" fill="#ffd45e">{nameTop}</text>
            <text x={doorU} y="-63.8" textAnchor="middle" fontSize="5.6" fontWeight="800" fontFamily="'M PLUS Rounded 1c', sans-serif" fill="#fff6e0" letterSpacing="1.4">{nameBottom.toUpperCase()}</text>
          </g>
        </FaceY>
        {/* side wall */}
        <FaceX x={N} y={0} z={0}>
          <rect x="0" y="0" width={N * 32} height="16" fill="#2c2234" />
          {Array.from({ length: N + 1 }, (_, i) => <rect key={i} x={i * 32 - 1.6} y="0" width="3.2" height={H} fill="#6e4429" />)}
          {Array.from({ length: N }, (_, i) => <Win key={i} u={i * 32 + 5} v={26} w={22} h={32} glow={lit} peek={i % 3 === 1 ? i + 7 : -1} />)}
        </FaceX>
        {phase !== 'day' && <path className="steam" d={`M${P(N + 0.2, 1.2, H - 6)[0]} ${P(N + 0.2, 1.2, H - 6)[1]}q-5 -8 0 -15t0 -15`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />}
        <Lantern x={P(door + 0.05, N + 0.05, 44)[0]} y={P(door + 0.05, N + 0.05, 44)[1]} glow={glow} />
        <Lantern x={P(door + 0.95, N + 0.05, 44)[0]} y={P(door + 0.95, N + 0.05, 44)[1]} glow={glow} />

        {/* upstairs lounge */}
        {hasUp && (
          <g>
            {ring}
            <Box x={0} y={0} w={U} d={U} h={H} z={zGround} c={PLASTER} />
            <Box x={-0.16} y={-0.16} w={U + 0.32} d={U + 0.32} h={CORN} z={zGround + H} c={TIMBER} />
            <FaceY x={0} y={U} z={zGround}>
              {Array.from({ length: U + 1 }, (_, i) => <rect key={i} x={i * 32 - 1.6} y="0" width="3.2" height={H} fill="#6e4429" />)}
              {Array.from({ length: U }, (_, i) => <Win key={i} u={i * 32 + 4} v={14} w={24} h={40} glow={lit} peek={i < upSeats ? i + 3 : -1} />)}
            </FaceY>
            <FaceX x={U} y={0} z={zGround}>
              {Array.from({ length: U + 1 }, (_, i) => <rect key={i} x={i * 32 - 1.6} y="0" width="3.2" height={H} fill="#6e4429" />)}
              {Array.from({ length: U }, (_, i) => <Win key={i} u={i * 32 + 4} v={14} w={24} h={40} glow={lit} />)}
            </FaceX>
            <Box x={U / 2 - 1.2} y={U} w={2.4} d={0.4} h={3} z={zGround + 4} c={TIMBER} sw={1.8} />
            {[0, 1, 2, 3, 4].map((i) => <Box key={i} x={U / 2 - 1.2 + i * 0.6} y={U + 0.34} w={0.06} d={0.06} h={12} z={zGround + 7} c={TIMBER} sw={1.2} />)}
            <Box x={U / 2 - 1.2} y={U + 0.34} w={2.4} d={0.06} h={2.4} z={zGround + 19} c={TIMBER} sw={1.4} />
            <Lantern x={P(U / 2 - 1, U + 0.3, zGround + 26)[0]} y={P(U / 2 - 1, U + 0.3, zGround + 26)[1]} glow={glow} s={0.85} />
            <Lantern x={P(U / 2 + 1, U + 0.3, zGround + 26)[0]} y={P(U / 2 + 1, U + 0.3, zGround + 26)[1]} glow={glow} s={0.85} />
          </g>
        )}

        {/* roof: a hip roof, or an open terrace if you built the rooftop */}
        {!roof && <HipRoof x={0} y={0} w={topS} d={topS} z={zTop} rh={Math.min(48, 26 + topS * 3)} />}
        {roof && (
          <g>
            {poly([P(0, 0, zTop), P(topS, 0, zTop), P(topS, topS, zTop), P(0, topS, zTop)], TILE[0])}
            <g transform={`translate(0 ${-zTop})`}>{Array.from({ length: R * R }, (_, i) => floorTile(roof.floor, Math.floor(i / R), i % R))}</g>
            <g transform={`translate(0 ${-zTop})`}>
              {rugs.map((p) => <g key={p.id} transform={`translate(${P(p.gx, p.gy)[0]} ${P(p.gx, p.gy)[1]})${p.flip ? ' scale(-1 1)' : ''}`}>{floorArt(p.type).art()}</g>)}
            </g>
            {things.map((p) => (
              <g key={p.id} transform={`translate(${P(p.gx, p.gy, zTop)[0]} ${P(p.gx, p.gy, zTop)[1]})${p.flip ? ' scale(-1 1)' : ''}`} pointerEvents="none">{floorArt(p.type).art()}</g>
            ))}
            {Array.from({ length: R + 1 }, (_, i) => (
              <g key={i}>
                <Box x={i - 0.035} y={R - 0.035} w={0.07} d={0.07} h={24} z={zTop} c={['#6b5586', '#4b3a63', '#33264a']} sw={1.4} />
                <Box x={R - 0.035} y={i - 0.035} w={0.07} d={0.07} h={24} z={zTop} c={['#6b5586', '#4b3a63', '#33264a']} sw={1.4} />
              </g>
            ))}
            <Box x={0} y={R - 0.03} w={R} d={0.05} h={3} z={zTop + 22} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.6} />
            <Box x={R - 0.03} y={0} w={0.05} d={R} h={3} z={zTop + 22} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.6} />
            {[[0, R, R, R], [R, 0, R, R]].map(([ax, ay, bx, by], i) => {
              const a = P(ax, ay, zTop + 56)
              const b = P(bx, by, zTop + 56)
              const mx = (a[0] + b[0]) / 2
              const my = (a[1] + b[1]) / 2 + 12
              return (
                <g key={i}>
                  <path d={`M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke="rgba(42,15,46,0.85)" strokeWidth="1.3" />
                  {[1, 2, 3, 4, 5].map((k) => {
                    const t = k / 6
                    const bx2 = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0]
                    const by2 = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1]
                    return <circle key={k} cx={bx2} cy={by2 + 2} r="2.4" fill="#ffe9a0" stroke={OL} strokeWidth="0.9" className="flick" style={{ animationDelay: `${-(k + i) * 0.7}s` }} />
                  })}
                </g>
              )
            })}
            {[[0, R], [R, R], [R, 0]].map(([px, py], i) => <Box key={i} x={px - 0.04} y={py - 0.04} w={0.08} d={0.08} h={58} z={zTop} c={['#6b5586', '#4b3a63', '#33264a']} sw={1.6} />)}
          </g>
        )}
      </g>

      {/* the line outside the door */}
      {Array.from({ length: queue }, (_, i) => {
        const [qx, qy] = P(door + 0.55 - i * 0.62, N + 0.82)
        return (
          <g key={i} transform={`translate(${qx - 17} ${qy - 36})`} pointerEvents="none">
            <ellipse cx="17" cy="36" rx="12" ry="4" fill="rgba(18,4,36,0.3)" />
            <g className="arrive" style={{ animationDelay: `${i * 0.08}s` }}><CustomerPortrait customer={CUSTOMERS[(i + 2) % CUSTOMERS.length]} mood="idle" size={34} /></g>
          </g>
        )
      })}
      {furniture.map(prop)}
      <Neighbor s={neighbors[1]} glow={lit} />
      </g>
    </svg>
  )
}
