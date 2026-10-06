import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Box, FaceY, OL, P, type Tri } from './iso'
import Room, { floorArt, phaseOf, RoomDefs, SKY, type Phase } from './Room'
import ZoomPan, { type Focus } from './ZoomPan'
import { neighbourRestaurant } from './neighbours'
import { AvatarFigure } from './AvatarFigure'
import { NAMES, type Avatar } from './avatar'
import { along, findRoute, routeLength, type TownGeometry, type V } from './townwalk'
import { HipRoof } from './Exterior'
import { decorScore, hasStorey, levelOf, NAME_WORDS, restaurantName, seatTotal, sizeOf, type Restaurant } from './restaurant'

interface Props {
  r: Restaurant
  avatar: Avatar
  onEditAvatar: () => void
  onBack: () => void
}

interface Lot {
  id: string
  c: number
  r: number
  /** Name word indices (adjective, food, noun). */
  name: [number, number, number]
  floors: number
  wall: Tri
  roof: Tri
  neon: string
  level: number
  score: number
  stars: number
  kind?: 'shop' | 'pagoda' | 'teahouse' | 'tower'
  mine?: boolean
}

const W = (a: string, b: string, c: string): Tri => [a, b, c]

// Neighbouring shops. Bots are labelled "Featured Shop" and never appear on leaderboards (see the spec).
const BOTS: Lot[] = [
  { id: 'b0', c: 0, r: 0, name: [3, 1, 4], floors: 2, wall: W('#ecdcc0', '#e6d2b0', '#cbb18a'), roof: W('#7a4a52', '#613b44', '#4a2c34'), neon: '#ff7fc0', level: 4, score: 640, stars: 4, kind: 'pagoda' },
  { id: 'b1', c: 1, r: 0, name: [1, 7, 0], floors: 1, wall: W('#f2e4cc', '#ecdcc0', '#d2bb94'), roof: W('#4a6a5a', '#3a5848', '#2c4538'), neon: '#6dffc0', level: 3, score: 330, stars: 3, kind: 'teahouse' },
  { id: 'b2', c: 2, r: 0, name: [7, 5, 5], floors: 3, wall: W('#e4d2b2', '#dcc8a6', '#c2a97f'), roof: W('#51628a', '#3f4f78', '#2f3d62'), neon: '#7fe6ff', level: 6, score: 1480, stars: 5, kind: 'tower' },
  { id: 'b3', c: 0, r: 1, name: [4, 0, 6], floors: 1, wall: W('#f0dcc0', '#ead4b4', '#cdb08c'), roof: W('#8a5a3a', '#6e4429', '#52301c'), neon: '#ffd23a', level: 2, score: 190, stars: 3, kind: 'teahouse' },
  { id: 'b4', c: 2, r: 1, name: [2, 3, 3], floors: 2, wall: W('#efe0c4', '#e8d6b6', '#cdb48c'), roof: W('#6a4a7a', '#563a66', '#432c52'), neon: '#d29bff', level: 5, score: 880, stars: 4, kind: 'pagoda' },
  { id: 'b5', c: 0, r: 2, name: [5, 6, 7], floors: 2, wall: W('#e9d8bc', '#e2cfae', '#c6ae86'), roof: W('#7a4a52', '#613b44', '#4a2c34'), neon: '#ff9a4e', level: 3, score: 410, stars: 3 },
  { id: 'b6', c: 1, r: 2, name: [6, 4, 1], floors: 1, wall: W('#f2e2c8', '#ecdabc', '#d0b890'), roof: W('#4a6a5a', '#3a5848', '#2c4538'), neon: '#ff7fc0', level: 2, score: 150, stars: 2 },
  { id: 'b7', c: 2, r: 2, name: [0, 2, 2], floors: 2, wall: W('#e6d4b4', '#dfcaa8', '#c4aa80'), roof: W('#51628a', '#3f4f78', '#2f3d62'), neon: '#6dffc0', level: 4, score: 560, stars: 4, kind: 'tower' },
]

const LOT = 3.2
const STREET = 1.2
const MARGIN = 1
const lotOrigin = (c: number, r: number): [number, number] => [MARGIN + c * (LOT + STREET), MARGIN + r * (LOT + STREET)]
const SIZE = MARGIN * 2 + LOT * 3 + STREET * 2

const nameOf = (n: [number, number, number]): [string, string] => [`${NAME_WORDS[0][n[0]]} ${NAME_WORDS[1][n[1]]}`, NAME_WORDS[2][n[2]]]

function Shop({ lot, top, bottom, glow, selected, floors, deck }: { lot: Lot; top: string; bottom: string; glow: number; selected: boolean; floors: number; deck: boolean }) {
  const [x, y] = lotOrigin(lot.c, lot.r)
  const m = 0.3
  const w = LOT - m * 2
  const bx = x + m
  const by = y + m
  const FH = 34
  const h = floors * FH
  const tiles = Math.floor(w)
  return (
    <g>
      {selected && <polygon points={[P(x, y), P(x + LOT, y), P(x + LOT, y + LOT), P(x, y + LOT)].map((p) => p.join(',')).join(' ')} fill="rgba(255,210,58,0.28)" stroke="#ffd23a" strokeWidth="3" strokeLinejoin="round" className="selpulse" />}
      <Box x={bx} y={by} w={w} d={w} h={h} c={lot.wall} />
      <Box x={bx - 0.1} y={by - 0.1} w={w + 0.2} d={w + 0.2} h={3} z={h} c={['#8a5b38', '#6e4429', '#52301c']} sw={1.6} />
      {deck ? (
        <g>
          <polygon points={[P(bx, by, h + 3), P(bx + w, by, h + 3), P(bx + w, by + w, h + 3), P(bx, by + w, h + 3)].map((p) => p.join(',')).join(' ')} fill="#7fcf5a" stroke={OL} strokeWidth="1.6" strokeLinejoin="round" />
          <Box x={bx + w * 0.5} y={by + w * 0.4} w={0.5} d={0.5} h={7} z={h + 3} c={['#ffd0e0', '#f3a0c0', '#c97a9a']} sw={1.4} />
          <Box x={bx - 0.02} y={by + w - 0.02} w={w} d={0.05} h={2.4} z={h + 14} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.4} />
          <Box x={bx + w - 0.02} y={by} w={0.05} d={w} h={2.4} z={h + 14} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.4} />
        </g>
      ) : lot.kind === 'pagoda' ? (
        <g>
          <HipRoof x={bx} y={by} w={w} d={w} z={h + 3} rh={13} over={0.3} c={lot.roof} />
          <Box x={bx + w * 0.22} y={by + w * 0.22} w={w * 0.56} d={w * 0.56} h={14} z={h + 14} c={lot.wall} sw={1.6} />
          <HipRoof x={bx + w * 0.22} y={by + w * 0.22} w={w * 0.56} d={w * 0.56} z={h + 28} rh={16} over={0.3} c={lot.roof} />
          <Box x={bx + w / 2 - 0.03} y={by + w / 2 - 0.03} w={0.06} d={0.06} h={14} z={h + 42} c={['#ffd23a', '#e0a41a', '#b07a10']} sw={1.2} />
        </g>
      ) : lot.kind === 'tower' ? (
        <g>
          <Box x={bx + w * 0.1} y={by + w * 0.1} w={w * 0.8} d={w * 0.8} h={4} z={h + 3} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.4} />
          <Box x={bx + w * 0.55} y={by + w * 0.2} w={w * 0.28} d={w * 0.28} h={12} z={h + 7} c={['#c8d0e4', '#98a2bc', '#7a84a0']} sw={1.4} />
          <Box x={bx + w * 0.22} y={by + w * 0.6} w={0.05} d={0.05} h={30} z={h + 7} c={['#d8dcec', '#aab2c8', '#8890aa']} sw={1.2} />
          <circle cx={P(bx + w * 0.22 + 0.025, by + w * 0.6 + 0.025, h + 38)[0]} cy={P(bx + w * 0.22 + 0.025, by + w * 0.6 + 0.025, h + 38)[1]} r="2.6" fill="#ff3d57" stroke={OL} strokeWidth="1" className="flick" />
        </g>
      ) : lot.kind === 'teahouse' ? (
        <g>
          <HipRoof x={bx} y={by} w={w} d={w} z={h + 3} rh={30} over={0.35} c={lot.roof} />
          <Box x={bx + w * 0.7} y={by + w * 0.25} w={0.3} d={0.3} h={14} z={h + 12} c={['#a8584a', '#8a4438', '#6a3028']} sw={1.4} />
          <path className="steam" d={`M${P(bx + w * 0.7 + 0.15, by + w * 0.25 + 0.15, h + 30).join(' ')}q-5 -7 0 -12t0 -10`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
        </g>
      ) : (
        <HipRoof x={bx} y={by} w={w} d={w} z={h + 3} rh={20 + floors * 3} over={0.2} c={lot.roof} />
      )}
      <FaceY x={bx} y={by + w} z={0}>
        <rect x="0" y="0" width={w * 32} height="9" fill="#2c2234" />
        {Array.from({ length: tiles }, (_, i) =>
          Array.from({ length: floors }, (_, f) => (
            <g key={`${i}${f}`}>
              <rect x={i * 32 + 6} y={14 + f * FH} width="18" height="16" fill="#4b2f20" stroke={OL} strokeWidth="1.2" />
              <rect x={i * 32 + 7.4} y={15.4 + f * FH} width="15.2" height="13.2" fill="url(#townWin)" opacity={0.25 + glow * 0.75} />
            </g>
          )),
        )}
        <rect x={w * 16 - 24} y="28" width="48" height="11" rx="2" fill="#150f2a" stroke={OL} strokeWidth="1.4" />
        <g transform="scale(1 -1)" className="flick" style={{ filter: 'url(#neon)' }}>
          <text x={w * 16} y="-34" textAnchor="middle" fontSize="6.4" fontWeight="800" fontFamily="'Mochiy Pop One', sans-serif" fill={lot.neon}>{top.length > 13 ? top.slice(0, 13) : top}</text>
        </g>
      </FaceY>
      <text x={P(bx + w / 2, by + w, 0)[0]} y={P(bx + w / 2, by + w, 0)[1] + 12} textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff6e0" opacity="0.8" fontFamily="'M PLUS Rounded 1c', sans-serif">{bottom}</text>
    </g>
  )
}

/** Tiles per second the avatar walks. */
const SPEED = 3.4
const GEO: TownGeometry = {
  size: SIZE,
  lots: Array.from({ length: 9 }, (_, i) => [...lotOrigin(i % 3, Math.floor(i / 3)), LOT] as [number, number, number]),
  bridge: { x0: MARGIN + LOT + STREET / 2 - 0.8, x1: MARGIN + LOT + STREET / 2 + 0.8, yEnd: SIZE + 3 },
}
const doorFront = (l: { c: number; r: number }): V => {
  const [x, y] = lotOrigin(l.c, l.r)
  return [x + LOT / 2, y + LOT + 0.45]
}

export default function Town({ r, avatar, onEditAvatar, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>(() => phaseOf())
  const [sel, setSel] = useState<string | null>('mine')
  const [visiting, setVisiting] = useState<string | null>(null)
  const [focus, setFocus] = useState<Focus | undefined>(undefined)
  const mapRef = useRef<SVGSVGElement>(null)
  const [me, setMe] = useState<{ pos: V; left: boolean; walking: boolean }>(() => ({ pos: doorFront({ c: 1, r: 1 }), left: false, walking: false }))
  const meRef = useRef(me)
  meRef.current = me
  const trip = useRef<{ route: V[]; walked: number; then?: () => void } | null>(null)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  /** Walk the avatar to a spot along the pavement, then run a callback. */
  const walkTo = (to: V, then?: () => void) => {
    const route = findRoute(GEO, meRef.current.pos, to)
    cancelAnimationFrame(raf.current)
    if (!route || route.length < 2 || routeLength(route) < 0.05) {
      trip.current = null
      setMe((m) => ({ ...m, walking: false }))
      then?.()
      return
    }
    trip.current = { route, walked: 0, then }
    let last = performance.now()
    const step = (now: number) => {
      const tr = trip.current
      if (!tr) return
      tr.walked += SPEED * Math.min(0.05, (now - last) / 1000)
      last = now
      const a = along(tr.route, tr.walked)
      setMe({ pos: a.pos, left: a.dx - a.dy < 0, walking: !a.done })
      if (a.done) {
        trip.current = null
        tr.then?.()
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  /** Turn a tap on the map into a spot on the ground. */
  const groundTap = (e: React.PointerEvent) => {
    const svg = mapRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const q = pt.matrixTransform(m.inverse())
    walkTo([(q.y / 16 + q.x / 32) / 2, (q.y / 16 - q.x / 32) / 2])
  }
  useEffect(() => {
    const id = setInterval(() => setPhase(phaseOf()), 60_000)
    return () => clearInterval(id)
  }, [])
  const glow = phase === 'day' ? 0.15 : phase === 'dawn' ? 0.55 : 1
  const lamps = SKY[phase].glow

  const mine: Lot = {
    id: 'mine', c: 1, r: 1, name: [0, 0, 0], floors: 1 + (hasStorey(r, 'upstairs') ? 1 : 0), wall: W('#f3e6cc', '#f0e0c0', '#d8c29d'),
    roof: W('#51628a', '#3f4f78', '#2f3d62'), neon: '#ffd45e', level: levelOf(r), score: decorScore(r), stars: 0, mine: true,
  }
  const lots = [...BOTS, mine].sort((a, b) => a.c + a.r - (b.c + b.r))
  const [myTop, myBottom] = restaurantName(r)
  const minX = -SIZE * 32 - 40
  const maxX = SIZE * 32 + 40
  const minY = -140
  const maxY = (SIZE + 3.4) * 32 + 30

  /** Select a shop and swing the camera over to it. */
  /** Select a shop, walk up to it and swing the camera over. */
  const visitLot = (l: Lot) => {
    goTo(l)
    walkTo(doorFront(l))
  }
  const goTo = (l: Lot) => {
    setSel(l.id)
    const el = mapRef.current
    if (!el) return
    const [x, y] = lotOrigin(l.c, l.r)
    const [px, py] = P(x + LOT / 2, y + LOT / 2, l.floors * 17)
    const vw = maxX - minX
    const vh = maxY - minY
    const sw = el.clientWidth
    const sh = el.clientHeight
    const zp = el.closest('.zp') as HTMLElement | null
    const bw = zp?.clientWidth ?? sw
    const bh = zp?.clientHeight ?? sh
    const k = Math.min(sw / vw, sh / vh)
    setFocus({ fx: ((sw - vw * k) / 2 + (px - minX) * k) / bw, fy: ((sh - vh * k) / 2 + (py - minY) * k) / bh, s: 2.4, n: (focus?.n ?? 0) + 1 })
  }
  const labelOf = (l: Lot): [string, string] => (l.mine ? [myTop, myBottom] : nameOf(l.name))

  const props: { type: 'lamp' | 'sakura' | 'ramencart' | 'stonelantern' | 'vending' | 'bench' | 'torii'; x: number; y: number }[] = [
    { type: 'torii', x: 6.0, y: -0.9 },
    { type: 'lamp', x: 4.5, y: 4.5 }, { type: 'lamp', x: 8.9, y: 4.5 }, { type: 'lamp', x: 4.5, y: 8.9 }, { type: 'lamp', x: 8.9, y: 8.9 },
    { type: 'sakura', x: 4.55, y: 0.1 }, { type: 'sakura', x: 9.0, y: 12.6 }, { type: 'ramencart', x: 0.1, y: 4.55 }, { type: 'ramencart', x: 13.1, y: 8.9 },
    { type: 'vending', x: 8.9, y: 0.3 }, { type: 'stonelantern', x: 4.5, y: 13.1 }, { type: 'bench', x: 0.1, y: 8.95 }, { type: 'sakura', x: 13.1, y: 4.5 },
  ]

  const walkers: { x: number; y: number; dx: number; dy: number; d: number; color: string }[] = [
    { x: 4.8, y: 1.2, dx: 0, dy: 3, d: 0, color: '#ff7fc0' }, { x: 4.8, y: 9.4, dx: 0, dy: 3, d: -3, color: '#6dffc0' },
    { x: 9.2, y: 12.4, dx: 0, dy: -3, d: -1.5, color: '#ffd23a' }, { x: 1.2, y: 4.8, dx: 3, dy: 0, d: -2, color: '#7fe6ff' },
    { x: 9.6, y: 9.2, dx: 3, dy: 0, d: -4, color: '#ff9a4e' }, { x: 5.6, y: 4.8, dx: 3, dy: 0, d: -5, color: '#d29bff' },
  ]

  /** The avatar is drawn over a building when standing past its far edges, behind it otherwise. */
  const inFront = (l: Lot) => {
    const [ox, oy] = lotOrigin(l.c, l.r)
    return me.pos[0] >= ox + LOT || me.pos[1] >= oy + LOT
  }
  const shopEl = (l: Lot) => (
    <g key={l.id} style={{ cursor: 'pointer' }} onPointerUp={() => visitLot(l)}>
      <Shop lot={l} top={labelOf(l)[0]} bottom={labelOf(l)[1]} glow={glow} selected={sel === l.id} floors={l.floors} deck={!!l.mine && hasStorey(r, 'rooftop')} />
    </g>
  )
  const selected = lots.find((l) => l.id === sel) ?? null
  const [selTop, selBottom] = selected ? labelOf(selected) : ['', '']
  const ground: ReactNode = (
    <g onPointerUp={groundTap}>
      <polygon points={[P(-1, -1), P(SIZE + 1, -1), P(SIZE + 1, SIZE + 1), P(-1, SIZE + 1)].map((p) => p.join(',')).join(' ')} fill="#2b2147" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {Array.from({ length: 3 }, (_, c) => Array.from({ length: 3 }, (_, rr) => {
        const [x, y] = lotOrigin(c, rr)
        return <polygon key={`${c}${rr}`} points={[P(x, y), P(x + LOT, y), P(x + LOT, y + LOT), P(x, y + LOT)].map((p) => p.join(',')).join(' ')} fill="#4a4268" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
      }))}
      {[MARGIN + LOT + STREET / 2, MARGIN + LOT * 2 + STREET * 1.5].map((s) => (
        <g key={s}>
          <path d={`M${P(s, 0).join(',')}L${P(s, SIZE).join(',')}`} stroke="rgba(255,236,170,0.45)" strokeWidth="2" strokeDasharray="10 9" />
          <path d={`M${P(0, s).join(',')}L${P(SIZE, s).join(',')}`} stroke="rgba(255,236,170,0.45)" strokeWidth="2" strokeDasharray="10 9" />
        </g>
      ))}
      {lamps > 0.15 && [[4.5, 4.5], [8.9, 4.5], [4.5, 8.9], [8.9, 8.9]].map(([lx, ly], i) => {
        const [px, py] = P(lx, ly)
        return <ellipse key={i} cx={px} cy={py} rx="62" ry="31" fill="url(#lampPool)" opacity={lamps} pointerEvents="none" />
      })}
      {/* the river at the front and its bridge */}
      <polygon points={[P(-1, SIZE + 0.6), P(SIZE + 1, SIZE + 0.6), P(SIZE + 1, SIZE + 3.2), P(-1, SIZE + 3.2)].map((p) => p.join(',')).join(' ')} fill="url(#water)" opacity="0.85" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
      {[0.2, 0.55, 0.9, 1.25, 1.6, 2.0].map((o, i) => (
        <path key={i} className="ripple2" style={{ animationDelay: `${-i * 0.9}s` }} d={`M${P(2 + i * 2, SIZE + 0.9 + o).join(',')}l14 7`} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      ))}
      {[{ y: SIZE + 1.5, x: 1, dx: 5.5, d: 0, c: '#ff7a45' }, { y: SIZE + 2.4, x: 11, dx: -6, d: -9, c: '#6dffc0' }].map((b, i) => {
        const [bx, by] = P(b.x, b.y)
        const [ex, ey] = P(b.x + b.dx, b.y)
        return (
          <g key={`boat${i}`} transform={`translate(${bx} ${by})`} pointerEvents="none">
            <g className="boat" style={{ ['--tx' as string]: `${ex - bx}px`, ['--ty' as string]: `${ey - by}px`, animationDelay: `${b.d}s` } as CSSProperties}>
              <g className="bsway">
                <path d="M-15 -3q15 12 30 0l-4 7q-11 5 -22 0z" fill="#8a5a3a" stroke={OL} strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M0 -3V-14" stroke={OL} strokeWidth="1.6" />
                <ellipse cx="0" cy="-18" rx="5" ry="6.4" fill={b.c} stroke={OL} strokeWidth="1.5" className="flick" />
                <ellipse cx="0" cy="-18" rx="11" ry="9" fill={b.c} opacity={0.22 + lamps * 0.3} style={{ mixBlendMode: 'screen' }} />
              </g>
            </g>
          </g>
        )
      })}
      <Box x={MARGIN + LOT + STREET / 2 - 0.8} y={SIZE + 0.4} w={1.6} d={2.9} h={6} c={['#c99a5c', '#a5763f', '#7a4e30']} />
      {[0, 1].map((k) => <Box key={k} x={MARGIN + LOT + STREET / 2 - 0.8 + k * 1.5} y={SIZE + 0.4} w={0.1} d={2.9} h={12} z={6} c={['#e4574a', '#b92d3e', '#8f1f38']} sw={1.4} />)}
    </g>
  )

  const pole = (x: number, y: number) => <Box key={`${x}${y}`} x={x - 0.04} y={y - 0.04} w={0.08} d={0.08} h={46} c={['#6b5586', '#4b3a63', '#33264a']} sw={1.4} />
  const strings = [
    [[4.8, 0.6], [4.8, SIZE - 0.4]], [[9.2, 0.6], [9.2, SIZE - 0.4]], [[0.6, 4.8], [SIZE - 0.4, 4.8]], [[0.6, 9.2], [SIZE - 0.4, 9.2]],
  ].map(([a, b], i) => {
    const pa = P(a[0], a[1], 46)
    const pb = P(b[0], b[1], 46)
    const mx = (pa[0] + pb[0]) / 2
    const my = (pa[1] + pb[1]) / 2 + 22
    return (
      <g key={i} pointerEvents="none">
        <path d={`M${pa[0]} ${pa[1]}Q${mx} ${my} ${pb[0]} ${pb[1]}`} fill="none" stroke="rgba(42,15,46,0.7)" strokeWidth="1.2" />
        {Array.from({ length: 9 }, (_, k) => {
          const t = (k + 1) / 10
          const flag = i % 2 === 1
          const bx = (1 - t) * (1 - t) * pa[0] + 2 * (1 - t) * t * mx + t * t * pb[0]
          const by = (1 - t) * (1 - t) * pa[1] + 2 * (1 - t) * t * my + t * t * pb[1]
          if (flag) return <path key={k} d={`M${bx - 3.4} ${by + 1}h6.8l-3.4 7.4z`} fill={['#ff5b6e', '#ffd23a', '#6dffc0', '#7fe6ff', '#d29bff'][(k + i) % 5]} stroke={OL} strokeWidth="0.8" strokeLinejoin="round" />
          return <circle key={k} cx={bx} cy={by + 2} r="2.2" fill="#ffd9a0" stroke={OL} strokeWidth="0.8" className="flick" style={{ animationDelay: `${-(k + i) * 0.6}s` }} />
        })}
      </g>
    )
  })

  const visited = lots.find((l) => l.id === visiting && !l.mine)
  if (visited) {
    const [vTop, vBottom] = labelOf(visited)
    const inside = neighbourRestaurant(Number(visited.id.slice(1)) + 1, visited.level)
    return (
      <main className="screen town visit">
        <header className="bar">
          <button className="btn ghost" onClick={() => setVisiting(null)}>Leave</button>
          <h2>{vTop}</h2>
          <span className="spacer" />
        </header>
        <div className="stage">
          <ZoomPan resetKey={visited.id}>
            <Room r={inside} grid={inside.size ?? 5} storey="ground" avatar={avatar} />
          </ZoomPan>
        </div>
        <section className="townsheet">
          <div className="ts-head">
            <div>
              <h3>{vTop} <small>{vBottom}</small></h3>
              <p>Featured Shop · Level {visited.level} · {visited.score} decor</p>
            </div>
            <span className="stars" aria-label={`${visited.stars} of 5 stars`}>{'★'.repeat(visited.stars)}<span className="dim">{'★'.repeat(5 - visited.stars)}</span></span>
          </div>
          <p className="ts-note">Pick up ideas for your own place. Leaving a tip opens with accounts.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="screen town">
      <header className="bar">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <h2>Night Market</h2>
        <span className="spacer" />
      </header>

      <nav className="townchips" aria-label="Places">
        {[...lots].sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || a.r - b.r || a.c - b.c).map((l) => (
          <button key={l.id} className={`tchip${sel === l.id ? ' on' : ''}`} onClick={() => visitLot(l)} style={{ ['--neon' as string]: l.neon } as CSSProperties}>
            <i aria-hidden />{l.mine ? 'My shop' : labelOf(l)[0]}
          </button>
        ))}
        <button className="tchip me" onClick={onEditAvatar}><i aria-hidden />Change look</button>
      </nav>

      <div className="stage townstage">
        <ZoomPan resetKey="town" startScale={1.35} focus={focus}>
          <svg ref={mapRef} className="townmap" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img" aria-label="Map of the Night Market district">
            <RoomDefs phase={phase} />
            <defs>
              <radialGradient id="lampPool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd9a0" stopOpacity="0.5" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></radialGradient>
              <linearGradient id="townWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0b8" /><stop offset="1" stopColor="#ff9a4e" /></linearGradient>
              <radialGradient id="townFadeG" cx="0.5" cy="0.5" r="0.66"><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
              <mask id="townFade" maskUnits="userSpaceOnUse" x={minX} y={minY} width={maxX - minX} height={maxY - minY}><rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#townFadeG)" /></mask>
            </defs>
            <g mask="url(#townFade)">
              {ground}
              {[4.8, 9.2].flatMap((s) => [[s, 0.6], [s, SIZE - 0.4], [0.6, s], [SIZE - 0.4, s]]).map(([x, y]) => pole(x, y))}
              {lots.filter(inFront).map(shopEl)}
              <g transform={`translate(${P(me.pos[0], me.pos[1])[0]} ${P(me.pos[0], me.pos[1])[1]})`} pointerEvents="none">
                <ellipse cx="0" cy="1" rx="9" ry="4" fill="none" stroke="#7fe6ff" strokeWidth="1.4" opacity="0.7" className="ripple2" />
                <g transform="scale(1.1)"><AvatarFigure a={avatar} left={me.left} walking={me.walking} /></g>
              </g>
              {lots.filter((l) => !inFront(l)).map(shopEl)}
              {props.map((p) => {
                const art = floorArt(p.type)
                const [px, py] = P(p.x, p.y)
                return (
                  <g key={`${p.type}${p.x}${p.y}`} transform={`translate(${px} ${py}) scale(0.82)`} pointerEvents="none">
                    {art.glow && <g style={{ mixBlendMode: 'screen' }} opacity={lamps}>{art.glow()}</g>}
                    {art.art()}
                  </g>
                )
              })}
              {strings}
              {/* a see-through copy and name tag on top, so you never lose yourself behind a building */}
              <g transform={`translate(${P(me.pos[0], me.pos[1])[0]} ${P(me.pos[0], me.pos[1])[1]})`} pointerEvents="none">
                <g transform="scale(1.1)" opacity="0.45"><AvatarFigure a={avatar} left={me.left} walking={me.walking} /></g>
                <text y="-58" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#fff" stroke="#2a0f2e" strokeWidth="1.6" paintOrder="stroke" fontFamily="'M PLUS Rounded 1c', sans-serif">{NAMES[avatar.name]}</text>
              </g>
              {walkers.map((w, i) => {
                const [wx, wy] = P(w.x, w.y)
                const [ex, ey] = P(w.x + w.dx, w.y + w.dy)
                return (
                  <g key={i} transform={`translate(${wx} ${wy})`} pointerEvents="none">
                    <g className="walker" style={{ ['--tx' as string]: `${ex - wx}px`, ['--ty' as string]: `${ey - wy}px`, animationDelay: `${w.d}s` } as CSSProperties}>
                      <ellipse cx="0" cy="1" rx="4" ry="1.6" fill="rgba(0,0,0,0.35)" />
                      <rect x="-2.6" y="-9" width="5.2" height="8" rx="2.4" fill={w.color} stroke={OL} strokeWidth="1" />
                      <circle cx="0" cy="-11.4" r="2.8" fill="#ffe1c4" stroke={OL} strokeWidth="1" />
                    </g>
                  </g>
                )
              })}
              {[[0.2, 0.7], [0.8, 0.9], [1.4, 0.4]].map(([qx, qy], i) => {
                const [ox, oy] = lotOrigin(1, 1)
                const [px, py] = P(ox + 1.3 + qx, oy + LOT + qy)
                return (
                  <g key={`q${i}`} transform={`translate(${px} ${py})`} pointerEvents="none"><g className="bsway" style={{ animationDelay: `${-i * 0.7}s` }}>
                    <ellipse cx="0" cy="1" rx="4" ry="1.6" fill="rgba(0,0,0,0.35)" />
                    <rect x="-2.6" y="-9" width="5.2" height="8" rx="2.4" fill={['#ff7fc0', '#7fe6ff', '#ffd23a'][i]} stroke={OL} strokeWidth="1" />
                    <circle cx="0" cy="-11.4" r="2.8" fill="#ffe1c4" stroke={OL} strokeWidth="1" />
                  </g></g>
                )
              })}
              {/* "you are here" pin over your restaurant */}
              {(() => {
                const [x, y] = lotOrigin(1, 1)
                const top = (1 + (hasStorey(r, 'upstairs') ? 1 : 0)) * 34 + 46
                const [px, py] = P(x + LOT / 2, y + LOT / 2, top)
                return (
                  <g transform={`translate(${px} ${py})`} pointerEvents="none"><g className="pin">
                    <path d="M0 0C-9 -12 -10 -22 0 -26C10 -22 9 -12 0 0Z" fill="#ff5b6e" stroke={OL} strokeWidth="2" />
                    <circle cx="0" cy="-17" r="3.6" fill="#fff" />
                  </g></g>
                )
              })()}
            </g>
            {phase !== 'day' && [[-120, -96, 0], [90, -118, -1.6], [-10, -70, -3.1], [150, -62, -4.4]].map(([fx, fy, fd], i) => (
              <g key={`fw${i}`} transform={`translate(${fx} ${fy})`} pointerEvents="none">
                <g className="burst" style={{ animationDelay: `${fd}s` }}>
                  {Array.from({ length: 12 }, (_, k) => <line key={k} x1="0" y1="-5" x2="0" y2="-22" stroke={['#ffd23a', '#ff7fc0', '#7fe6ff', '#6dffc0'][i % 4]} strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${k * 30})`} />)}
                </g>
              </g>
            ))}
          </svg>
        </ZoomPan>
      </div>

      <section className="townsheet" aria-live="polite">
        {selected ? (
          <>
            <div className="ts-head">
              <div>
                <h3>{selTop} <small>{selBottom}</small></h3>
                <p>{selected.mine ? 'Your restaurant' : 'Featured Shop'} · Level {selected.level} · {selected.score} decor</p>
              </div>
              {selected.mine ? (
                <span className="stars">{'★'.repeat(5)}</span>
              ) : (
                <span className="stars" aria-label={`${selected.stars} of 5 stars`}>{'★'.repeat(selected.stars)}<span className="dim">{'★'.repeat(5 - selected.stars)}</span></span>
              )}
            </div>
            {selected.mine ? (
              <>
                <p className="ts-note">{hasStorey(r, 'rooftop') ? 'Three floors' : hasStorey(r, 'upstairs') ? 'Two floors' : 'One floor'}, {sizeOf(r, 'ground')}×{sizeOf(r, 'ground')} tiles, {seatTotal(r)} seats.</p>
                <button className="btn primary" onClick={onBack}>Go home</button>
              </>
            ) : (
              <>
                <p className="ts-note">Step inside and look around. Leaving tips opens with accounts.</p>
                <button className="btn primary" onClick={() => setVisiting(selected.id)}>Visit shop</button>
              </>
            )}
          </>
        ) : (
          <p className="ts-note">Tap a shop to see who runs it.</p>
        )}
      </section>
    </main>
  )
}
