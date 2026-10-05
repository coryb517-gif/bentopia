import type { ReactNode } from 'react'
import type { ItemType } from './restaurant'
import Mascot from './Mascot'

/** Isometric toolkit. One grid unit is 64px wide by 32px tall on screen; z is pixels up. */
export const OL = '#2a0f2e'
const OW = 2.4

export const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * 32, (x + y) * 16 - z]
const pt = (x: number, y: number, z = 0) => P(x, y, z).join(',')
const poly = (pts: string[], fill: string, sw = OW) => (
  <polygon points={pts.join(' ')} fill={fill} stroke={OL} strokeWidth={sw} strokeLinejoin="round" />
)

export type Tri = [top: string, left: string, right: string]

export function Box({ x, y, w, d, h, z = 0, c, sw = OW }: { x: number; y: number; w: number; d: number; h: number; z?: number; c: Tri; sw?: number }) {
  return (
    <g>
      {poly([pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], c[1], sw)}
      {poly([pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x + w, y, z + h)], c[2], sw)}
      {poly([pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], c[0], sw)}
    </g>
  )
}

const RX = 45.25
const RY = 22.63

/** An upright cylinder standing on the floor at grid point (cx, cy). */
export function Cyl({ cx, cy, r, h, z = 0, c, sw = OW }: { cx: number; cy: number; r: number; h: number; z?: number; c: [top: string, side: string]; sw?: number }) {
  const [sx, sy] = P(cx, cy, z)
  const rx = r * RX
  const ry = r * RY
  return (
    <g>
      <path d={`M${sx - rx} ${sy - h}V${sy}A${rx} ${ry} 0 0 0 ${sx + rx} ${sy}V${sy - h}Z`} fill={c[1]} stroke={OL} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx={sx} cy={sy - h} rx={rx} ry={ry} fill={c[0]} stroke={OL} strokeWidth={sw} />
    </g>
  )
}

/** Soft contact shadow under an item. */
export const Shadow = ({ cx, cy, r = 0.5 }: { cx: number; cy: number; r?: number }) => {
  const [sx, sy] = P(cx, cy)
  return <ellipse cx={sx} cy={sy + 2} rx={r * RX * 1.1} ry={r * RY * 1.1} fill="rgba(18, 4, 36, 0.38)" />
}

/** Draw on the +y face of a box: u runs along x and v up, both in pixels (32px per tile). */
export const FaceY = ({ x, y, z = 0, children }: { x: number; y: number; z?: number; children: ReactNode }) => {
  const [sx, sy] = P(x, y, z)
  return <g transform={`matrix(1 0.5 0 -1 ${sx} ${sy})`}>{children}</g>
}

/** Draw on the +x face of a box: u runs along y (toward the viewer) and v up, in pixels. */
export const FaceX = ({ x, y, z = 0, children }: { x: number; y: number; z?: number; children: ReactNode }) => {
  const [sx, sy] = P(x, y, z)
  return <g transform={`matrix(-1 0.5 0 -1 ${sx} ${sy})`}>{children}</g>
}

export const blob = (cx: number, cy: number, r: number, base: string, shade: string, key?: string | number) => (
  <g key={key}>
    <circle cx={cx} cy={cy} r={r} fill={shade} stroke={OL} strokeWidth={OW} />
    <circle cx={cx - r * 0.18} cy={cy - r * 0.2} r={r * 0.78} fill={base} />
    <circle cx={cx - r * 0.38} cy={cy - r * 0.42} r={r * 0.2} fill="#fff" opacity={0.55} />
  </g>
)

export const WOOD: Tri = ['#eac48c', '#c99a5c', '#a5763f']
export const RED: Tri = ['#e4574a', '#b92d3e', '#8f1f38']
export const DARK: Tri = ['#4b3a63', '#33264a', '#271c3a']
export const STONE: Tri = ['#d5d1da', '#a9a3b4', '#8a8498']
export const GOLD: Tri = ['#ffe58a', '#f0b232', '#c8841a']

export interface DecorArt {
  /** The item itself, in tile-local grid coordinates. */
  art: () => ReactNode
  /** Light pools drawn on the floor under everything. */
  glow?: () => ReactNode
  /** Mini-preview viewBox. */
  view: string
}

export const steam = (x: number, y: number, d = 0) => (
  <path className="steam" style={{ animationDelay: `${d}s` }} d={`M${x} ${y}q-4 -6 0 -11t0 -11`} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
)

export const DECOR_BASE: Partial<Record<ItemType, DecorArt>> = {
  table: {
    view: '-36 -36 72 76',
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.62} />
        <Box x={0.02} y={0.3} w={0.2} d={0.4} h={5} c={RED} />
        <Box x={0.78} y={0.3} w={0.2} d={0.4} h={5} c={RED} />
        <Box x={0.34} y={0.34} w={0.32} d={0.32} h={13} c={['#b0804a', '#8e6234', '#744d26']} />
        <Box x={0.14} y={0.14} w={0.72} d={0.72} h={5} z={13} c={WOOD} />
        <Cyl cx={0.4} cy={0.56} r={0.1} h={6} z={18} c={['#fffdf7', '#e6dcc6']} />
        <ellipse cx={P(0.4, 0.56, 24)[0]} cy={P(0.4, 0.56, 24)[1]} rx="5.5" ry="2.7" fill="#d4503b" />
        <Cyl cx={0.64} cy={0.42} r={0.085} h={9} z={18} c={['#9fd35a', '#5e9d2e']} />
        {steam(P(0.64, 0.42, 30)[0], P(0.64, 0.42, 30)[1], 0)}
        {steam(P(0.4, 0.56, 28)[0], P(0.4, 0.56, 28)[1], 0.9)}
      </g>
    ),
  },
  stool: {
    view: '-30 -32 60 66',
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.4} />
        <Cyl cx={0.5} cy={0.5} r={0.08} h={14} c={['#5b3b22', '#3f2916']} />
        <Cyl cx={0.5} cy={0.5} r={0.27} h={7} z={14} c={['#f06a5a', '#b92d3e']} />
        <ellipse cx={P(0.5, 0.5, 21)[0] - 8} cy={P(0.5, 0.5, 21)[1] - 2} rx="9" ry="3" fill="#fff" opacity="0.4" />
      </g>
    ),
  },
  lamp: {
    view: '-36 -92 72 126',
    glow: () => (
      <ellipse cx={P(0.5, 0.5)[0]} cy={P(0.5, 0.5)[1] + 4} rx="84" ry="44" fill="url(#glowWarm)" className="flick" />
    ),
    art: () => {
      const [lx, ly] = P(0.5, 0.5, 66)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.3} />
          <Cyl cx={0.5} cy={0.5} r={0.13} h={5} c={['#4b3a63', '#33264a']} />
          <Box x={0.47} y={0.47} w={0.06} d={0.06} h={46} z={4} c={['#6b5586', '#4b3a63', '#33264a']} sw={1.6} />
          <ellipse cx={lx} cy={ly} rx="19" ry="24" fill="#ffb347" opacity="0.35" className="flick" />
          <ellipse cx={lx} cy={ly} rx="15" ry="19" fill="#ff7a45" stroke={OL} strokeWidth={OW} />
          <path d={`M${lx - 15} ${ly}Q${lx} ${ly - 8} ${lx + 15} ${ly}M${lx - 13} ${ly + 8}Q${lx} ${ly + 2} ${lx + 13} ${ly + 8}M${lx - 13} ${ly - 8}Q${lx} ${ly - 14} ${lx + 13} ${ly - 8}`} fill="none" stroke="#c23a24" strokeWidth="2" />
          <ellipse cx={lx - 5} cy={ly - 6} rx="4" ry="7" fill="#fff" opacity="0.5" />
          <rect x={lx - 6} y={ly - 22} width="12" height="5" rx="2" fill="#33264a" stroke={OL} strokeWidth="1.8" />
          <rect x={lx - 6} y={ly + 17} width="12" height="5" rx="2" fill="#33264a" stroke={OL} strokeWidth="1.8" />
        </g>
      )
    },
  },
  bonsai: {
    view: '-32 -80 64 112',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 11)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.5} />
          <Box x={0.26} y={0.26} w={0.48} d={0.48} h={11} c={['#d9774a', '#b3552e', '#8e3f20']} />
          <path d={`M${bx} ${by}C${bx - 10} ${by - 12} ${bx + 8} ${by - 20} ${bx - 2} ${by - 32}`} fill="none" stroke={OL} strokeWidth="9" strokeLinecap="round" />
          <path d={`M${bx} ${by}C${bx - 10} ${by - 12} ${bx + 8} ${by - 20} ${bx - 2} ${by - 32}`} fill="none" stroke="#8e5a34" strokeWidth="5" strokeLinecap="round" />
          {blob(bx - 16, by - 34, 13, '#6fcf6a', '#3d9b3a', 1)}
          {blob(bx + 14, by - 38, 14, '#7fe074', '#43a640', 2)}
          {blob(bx - 1, by - 50, 14, '#8cec7e', '#4cb046', 3)}
        </g>
      )
    },
  },
  neko: {
    view: '-30 -72 60 102',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 9)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.5} />
          <Box x={0.24} y={0.24} w={0.52} d={0.52} h={9} c={RED} />
          <ellipse cx={bx} cy={by - 16} rx="15" ry="18" fill="#fffaf0" stroke={OL} strokeWidth={OW} />
          <ellipse cx={bx + 5} cy={by - 8} rx="7" ry="11" fill="#e9dfcb" opacity="0.7" />
          <path d={`M${bx - 11} ${by - 28}L${bx - 15} ${by - 44}L${bx - 2} ${by - 36}ZM${bx + 11} ${by - 28}L${bx + 15} ${by - 44}L${bx + 2} ${by - 36}Z`} fill="#fffaf0" stroke={OL} strokeWidth={OW} strokeLinejoin="round" />
          <ellipse cx={bx} cy={by - 33} rx="15" ry="12" fill="#fffaf0" stroke={OL} strokeWidth={OW} />
          <path d={`M${bx - 11} ${by - 34}q3 -4 6 0M${bx + 5} ${by - 34}q3 -4 6 0`} fill="none" stroke={OL} strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx={bx - 10} cy={by - 29} rx="3.2" ry="2" fill="#ff7d96" opacity="0.6" />
          <ellipse cx={bx + 10} cy={by - 29} rx="3.2" ry="2" fill="#ff7d96" opacity="0.6" />
          <path d={`M${bx - 2} ${by - 29}l2 2l2 -2z`} fill="#ff8fa8" stroke={OL} strokeWidth="1.2" />
          <path d={`M${bx - 11} ${by - 22}q11 5 22 0`} fill="none" stroke="#d9363e" strokeWidth="4" strokeLinecap="round" />
          <circle cx={bx} cy={by - 18} r="3.6" fill="#ffd23a" stroke={OL} strokeWidth="1.6" />
          <g className="wave" style={{ transformOrigin: `${bx + 14}px ${by - 14}px` }}>
            <rect x={bx + 11} y={by - 36} width="8" height="22" rx="4" fill="#fffaf0" stroke={OL} strokeWidth={OW} />
          </g>
          <ellipse cx={bx - 14} cy={by - 8} rx="6" ry="8" fill="#fffaf0" stroke={OL} strokeWidth={OW} />
          <ellipse cx={bx - 14} cy={by - 8} rx="3.5" ry="5" fill="#ffd23a" stroke={OL} strokeWidth="1.4" />
          <path d={`M${bx - 9} ${by - 48}l3 -5l3 5`} fill="none" stroke="#ffc233" strokeWidth="0" />
        </g>
      )
    },
  },
  counter: {
    view: '-44 -62 120 112',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.05} />
        <Box x={0} y={0.14} w={2} d={0.72} h={30} c={['#a5483a', '#b92d3e', '#8f1f38']} />
        <FaceY x={0} y={0.86}>
          <rect x="2" y="6" width="60" height="3" fill="#ffd45e" opacity="0.9" />
          <rect x="2" y="21" width="60" height="2.4" fill="#ffd45e" opacity="0.6" />
        </FaceY>
        <Box x={-0.03} y={0.1} w={2.06} d={0.8} h={5} z={30} c={WOOD} />
        {[0.5, 1.5].map((u) => {
          const [px, py] = P(u, 0.5, 35)
          return (
            <g key={u}>
              <ellipse cx={px} cy={py} rx="15" ry="7.5" fill="#fffdf7" stroke={OL} strokeWidth="1.8" />
              <ellipse cx={px - 4} cy={py - 3} rx="5.5" ry="3.4" fill="#ff8f66" stroke={OL} strokeWidth="1.4" />
              <ellipse cx={px - 4} cy={py - 1.5} rx="6" ry="2.6" fill="#fffaf0" stroke={OL} strokeWidth="1.2" />
              <ellipse cx={px + 5} cy={py - 3} rx="5.5" ry="3.4" fill="#ffd45e" stroke={OL} strokeWidth="1.4" />
              <ellipse cx={px + 5} cy={py - 1.5} rx="6" ry="2.6" fill="#fffaf0" stroke={OL} strokeWidth="1.2" />
            </g>
          )
        })}
        <Cyl cx={1} cy={0.38} r={0.07} h={5} z={35} c={['#4a3022', '#2f1d14']} />
      </g>
    ),
  },
  tank: {
    view: '-36 -68 72 102',
    art: () => {
      const [wx, wy] = P(0.5, 0.5, 44)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.62} />
          <Box x={0.12} y={0.12} w={0.76} d={0.76} h={14} c={['#6b5586', '#4b3a63', '#33264a']} />
          <Box x={0.18} y={0.18} w={0.64} d={0.64} h={32} z={14} c={['#9fe8ff', '#6fd0ec', '#4fb2d6']} sw={2} />
          <polygon points={[pt(0.18, 0.18, 40), pt(0.82, 0.18, 40), pt(0.82, 0.82, 40), pt(0.18, 0.82, 40)].join(' ')} fill="url(#water)" opacity="0.95" />
          <g className="fish" style={{ animationDelay: '0s' }}>
            <ellipse cx={wx - 4} cy={wy + 8} rx="7" ry="4.2" fill="#ff8a3d" stroke={OL} strokeWidth="1.4" />
            <path d={`M${wx + 3} ${wy + 8}l6 -4v8z`} fill="#ff8a3d" stroke={OL} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx={wx - 8} cy={wy + 7} r="1" fill={OL} />
          </g>
          <g className="fish" style={{ animationDelay: '-2.4s' }}>
            <ellipse cx={wx + 6} cy={wy + 18} rx="5.5" ry="3.4" fill="#ffd45e" stroke={OL} strokeWidth="1.3" />
            <path d={`M${wx + 12} ${wy + 18}l5 -3v6z`} fill="#ffd45e" stroke={OL} strokeWidth="1.1" strokeLinejoin="round" />
          </g>
          {[0, 1, 2].map((i) => (
            <circle key={i} className="bubble2" style={{ animationDelay: `${i * 0.8}s` }} cx={wx + 12 - i * 3} cy={wy + 22} r="1.8" fill="#fff" opacity="0.7" />
          ))}
          <Box x={0.14} y={0.14} w={0.72} d={0.72} h={3} z={46} c={['#6b5586', '#4b3a63', '#33264a']} sw={2} />
        </g>
      )
    },
  },
  sign: {
    view: '-34 -68 68 102',
    glow: () => <ellipse cx={P(0.5, 0.6)[0]} cy={P(0.5, 0.6)[1] + 6} rx="76" ry="38" fill="url(#glowPink)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.5} />
        <Box x={0.06} y={0.44} w={0.88} d={0.12} h={54} c={['#3a2a52', '#241a38', '#1a1228']} />
        <FaceY x={0.06} y={0.56}>
          <rect x="3" y="5" width="22" height="44" rx="2" fill="#120a20" />
          <g transform="scale(1 -1)" className="flick neon-t" style={{ filter: 'url(#neon)' }}>
            <text x="14" y="-31" textAnchor="middle" fontSize="8.5" fontWeight="800" fontFamily="'Mochiy Pop One', sans-serif" fill="#ff7fc0">OPEN</text>
          </g>
          <rect x="5" y="22" width="18" height="22" rx="2" fill="none" stroke="#7fe6ff" strokeWidth="1.4" opacity="0.85" style={{ filter: 'url(#neon)' }} />
          <rect x="5" y="9" width="18" height="9" rx="2" fill="none" stroke="#ffd23a" strokeWidth="1.2" opacity="0.8" style={{ filter: 'url(#neon)' }} />
        </FaceY>
      </g>
    ),
  },
  sakura: {
    view: '-46 -112 92 152',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 0)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.7} />
          <Box x={0.4} y={0.4} w={0.2} d={0.2} h={42} c={['#a06a40', '#835030', '#663c22']} />
          {blob(bx - 22, by - 54, 17, '#ffc4dc', '#ee86b2', 1)}
          {blob(bx + 20, by - 56, 18, '#ffcde2', '#f08fb8', 2)}
          {blob(bx, by - 70, 20, '#ffd6e8', '#f397bf', 3)}
          {blob(bx - 8, by - 46, 15, '#ffbcd8', '#e97fae', 4)}
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} className="petal2" style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${6 + i}s` }} cx={bx - 26 + i * 18} cy={by - 50} rx="3" ry="2" fill="#ffc4dc" stroke="#ee86b2" strokeWidth="0.8" />
          ))}
        </g>
      )
    },
  },
  vending: {
    view: '-34 -96 68 128',
    glow: () => <ellipse cx={P(0.5, 0.95)[0]} cy={P(0.5, 0.95)[1]} rx="70" ry="34" fill="url(#glowCyan)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.55} />
        <Box x={0.1} y={0.18} w={0.8} d={0.52} h={72} c={['#6fb8ff', '#3f7fd8', '#2d58a8']} />
        <FaceY x={0.1} y={0.7}>
          <rect x="2.5" y="28" width="16" height="38" rx="1.5" fill="#bff3ff" stroke={OL} strokeWidth="1.4" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((c) => (
              <rect key={`${row}-${c}`} x={4 + c * 4.6} y={31 + row * 11.5} width="3.4" height="8.5" rx="0.8" fill={['#ff5b6e', '#ffd23a', '#6dffc0', '#c4a8ff'][(row + c) % 4]} stroke={OL} strokeWidth="0.7" />
            )),
          )}
          <rect x="20" y="34" width="4.4" height="22" rx="1" fill="#1f3a7a" stroke={OL} strokeWidth="1" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx="22.2" cy={40 + i * 6} r="1.3" fill={['#ff5b6e', '#6dffc0', '#ffd23a'][i]} />
          ))}
          <rect x="2.5" y="8" width="16" height="14" rx="1.5" fill="#16306a" stroke={OL} strokeWidth="1.2" />
          <rect x="4.5" y="10.5" width="12" height="2.4" rx="0.6" fill="#ffd23a" opacity="0.9" />
        </FaceY>
        <Box x={0.1} y={0.18} w={0.8} d={0.52} h={6} z={72} c={['#ffd23a', '#e8a61a', '#c07a10']} sw={2} />
      </g>
    ),
  },
  taiko: {
    view: '-36 -64 72 100',
    art: () => {
      const [cx, cy] = P(0.5, 0.5, 38)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.6} />
          <Box x={0.14} y={0.14} w={0.12} d={0.72} h={12} c={DARK} />
          <Box x={0.74} y={0.14} w={0.12} d={0.72} h={12} c={DARK} />
          <Cyl cx={0.5} cy={0.5} r={0.31} h={30} z={8} c={['#fff1d0', '#c9362f']} />
          {Array.from({ length: 7 }, (_, i) => {
            const a = Math.PI * (0.12 + (i / 6) * 0.76)
            return <circle key={i} cx={cx + Math.cos(a) * 28} cy={cy + 30 + Math.sin(a) * 14} r="2.2" fill="#ffd23a" stroke={OL} strokeWidth="0.9" />
          })}
          <ellipse cx={cx} cy={cy} rx="21" ry="10.5" fill="none" stroke="#c9362f" strokeWidth="2.6" />
          <ellipse cx={cx - 6} cy={cy - 3} rx="7" ry="3" fill="#fff" opacity="0.45" />
          <path d={`M${cx - 14} ${cy - 11}L${cx + 10} ${cy - 1}M${cx + 14} ${cy - 11}L${cx - 10} ${cy - 1}`} stroke={OL} strokeWidth="5" strokeLinecap="round" />
          <path d={`M${cx - 14} ${cy - 11}L${cx + 10} ${cy - 1}M${cx + 14} ${cy - 11}L${cx - 10} ${cy - 1}`} stroke="#e8c88c" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )
    },
  },
  statue: {
    view: '-36 -98 72 130',
    glow: () => <ellipse cx={P(0.5, 0.5)[0]} cy={P(0.5, 0.5)[1]} rx="64" ry="32" fill="url(#glowGold)" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.6} />
        <Box x={0.16} y={0.16} w={0.68} d={0.68} h={9} c={STONE} />
        <Box x={0.22} y={0.22} w={0.56} d={0.56} h={13} z={9} c={GOLD} />
        <g transform={`translate(${P(0.5, 0.5, 22)[0] - 33} ${P(0.5, 0.5, 22)[1] - 66})`}>
          <Mascot mood="cheer" size={66} />
        </g>
        <path className="twinkle" d={`M${P(0.5, 0.5, 0)[0] + 28} ${P(0.5, 0.5, 70)[1]}l3 -8l3 8l8 3l-8 3l-3 8l-3 -8l-8 -3z`} fill="#fff" stroke="#ffc233" strokeWidth="1.2" />
      </g>
    ),
  },
  pond: {
    view: '-40 -42 112 86',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.1} />
        <Box x={0.02} y={0.04} w={1.96} d={0.92} h={8} c={STONE} />
        <polygon points={[pt(0.14, 0.16, 8), pt(1.86, 0.16, 8), pt(1.86, 0.84, 8), pt(0.14, 0.84, 8)].join(' ')} fill="url(#water)" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx={P(1, 0.5, 8)[0]} cy={P(1, 0.5, 8)[1]} rx="40" ry="10" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.5" className="ripple" />
        <g className="koi" style={{ animationDelay: '0s' }}>
          <ellipse cx={P(0.7, 0.45, 8)[0]} cy={P(0.7, 0.45, 8)[1]} rx="9" ry="4.4" fill="#ff7a3d" stroke={OL} strokeWidth="1.4" />
          <path d={`M${P(0.7, 0.45, 8)[0] + 8} ${P(0.7, 0.45, 8)[1]}l7 -4v8z`} fill="#ff7a3d" stroke={OL} strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx={P(0.7, 0.45, 8)[0] - 3} cy={P(0.7, 0.45, 8)[1] - 1} r="2" fill="#fffaf0" />
        </g>
        <g className="koi" style={{ animationDelay: '-3s', animationDirection: 'reverse' }}>
          <ellipse cx={P(1.3, 0.55, 8)[0]} cy={P(1.3, 0.55, 8)[1]} rx="8" ry="4" fill="#fffaf0" stroke={OL} strokeWidth="1.4" />
          <path d={`M${P(1.3, 0.55, 8)[0] + 7} ${P(1.3, 0.55, 8)[1]}l6 -4v8z`} fill="#fffaf0" stroke={OL} strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx={P(1.3, 0.55, 8)[0] - 2} cy={P(1.3, 0.55, 8)[1]} r="2.2" fill="#ff7a3d" />
        </g>
        <ellipse cx={P(1.55, 0.3, 8)[0]} cy={P(1.55, 0.3, 8)[1]} rx="11" ry="5.5" fill="#6fcf6a" stroke={OL} strokeWidth="1.8" />
        <circle cx={P(1.55, 0.3, 11)[0]} cy={P(1.55, 0.3, 11)[1]} r="4" fill="#ffb3d1" stroke={OL} strokeWidth="1.4" />
        {blob(P(0.04, 0.1, 12)[0], P(0.04, 0.1, 12)[1], 7, '#cfcbd6', '#9a94a8', 'r1')}
        {blob(P(1.96, 0.9, 12)[0], P(1.96, 0.9, 12)[1], 6, '#cfcbd6', '#9a94a8', 'r2')}
      </g>
    ),
  },
  torii: {
    view: '-44 -126 120 172',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.0} />
        <Box x={0.14} y={0.4} w={0.16} d={0.2} h={84} c={RED} />
        <Box x={1.7} y={0.4} w={0.16} d={0.2} h={84} c={RED} />
        <Box x={0.14} y={0.43} w={1.72} d={0.14} h={8} z={62} c={RED} sw={2} />
        <Box x={0.14} y={0.38} w={0.16} d={0.24} h={4} z={0} c={['#33264a', '#271c3a', '#1a1228']} sw={1.6} />
        <Box x={1.7} y={0.38} w={0.16} d={0.24} h={4} z={0} c={['#33264a', '#271c3a', '#1a1228']} sw={1.6} />
        <Box x={-0.12} y={0.34} w={2.24} d={0.32} h={8} z={82} c={['#3a2a52', '#241a38', '#1a1228']} />
        <Box x={0.02} y={0.38} w={1.96} d={0.24} h={5} z={90} c={['#4b3a63', '#33264a', '#271c3a']} sw={2} />
        <FaceY x={0.86} y={0.57} z={66}>
          <rect x="0" y="0" width="9" height="14" rx="1" fill="#ffd23a" stroke={OL} strokeWidth="1.4" />
        </FaceY>
        <g className="sway" style={{ transformOrigin: `${P(1, 0.5, 62)[0]}px ${P(1, 0.5, 62)[1]}px` }}>
          <rect x={P(1, 0.5, 62)[0] - 5} y={P(1, 0.5, 62)[1] + 2} width="10" height="14" rx="4" fill="#ff7a45" stroke={OL} strokeWidth="1.8" />
        </g>
      </g>
    ),
  },
}
