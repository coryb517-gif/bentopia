import type { ReactNode } from 'react'
import { blob, Box, Cyl, DARK, type DecorArt, FaceY, GOLD, OL, P, RED, Shadow, steam, STONE, type Tri, WOOD } from './iso'
import type { ItemType } from './restaurant'

const STEEL: Tri = ['#eef2fa', '#c5cde0', '#a4aec8']
const NAVY: Tri = ['#3a3f8f', '#2a2f6e', '#1f2352']
const DWOOD: Tri = ['#9b6a3e', '#7a4e2c', '#5f3a1f']
const IRON: Tri = ['#5b566e', '#3c384f', '#2c293c']
const GLASS: Tri = ['rgba(200,236,255,0.55)', 'rgba(150,205,240,0.5)', 'rgba(110,170,220,0.5)']

const poly = (pts: [number, number][], fill: string, stroke = OL, sw = 2.2) => (
  <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
)
const plane = (x0: number, y0: number, x1: number, y1: number, z: number): [number, number][] => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]

const nigiri = (x: number, y: number, top: string) => (
  <g>
    <ellipse cx={x} cy={y} rx="5.2" ry="2.6" fill="#fffdf7" stroke={OL} strokeWidth="1.2" />
    <ellipse cx={x} cy={y - 1.6} rx="5.6" ry="2.4" fill={top} stroke={OL} strokeWidth="1.2" />
  </g>
)

const flame = (x: number, y: number, s = 1, d = 0) => (
  <g className="flame" style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }}>
    <path d={`M${x} ${y}c${-5 * s} ${-4 * s} ${-3 * s} ${-9 * s} 0 ${-14 * s}c${3 * s} ${5 * s} ${5 * s} ${10 * s} 0 ${14 * s}z`} fill="#ff8a2a" stroke={OL} strokeWidth="1.2" />
    <path d={`M${x} ${y}c${-2.5 * s} ${-2 * s} ${-1.5 * s} ${-5 * s} 0 ${-8 * s}c${1.6 * s} ${3 * s} ${2.5 * s} ${6 * s} 0 ${8 * s}z`} fill="#ffe070" />
  </g>
)

export const DECOR_NEW: Partial<Record<ItemType, DecorArt>> = {
  kotatsu: {
    view: '-36 -44 72 86',
    glow: () => <ellipse cx={P(0.5, 0.5)[0]} cy={P(0.5, 0.5)[1] + 4} rx="70" ry="36" fill="url(#glowWarm)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.66} />
        <Box x={0.05} y={0.05} w={0.9} d={0.9} h={16} c={['#f0705a', '#d04a48', '#a63040']} />
        <FaceY x={0.05} y={0.95}>
          <path d="M2 5H27M2 11H27" stroke="#ffd45e" strokeWidth="1.6" opacity="0.9" />
          {[6, 14, 22].map((u) => <path key={u} d={`M${u} 2l3 3l-3 3l-3 -3z`} fill="none" stroke="#ffe9a0" strokeWidth="1.1" opacity="0.8" />)}
        </FaceY>
        <Box x={0.14} y={0.14} w={0.72} d={0.72} h={4} z={16} c={WOOD} />
        <Cyl cx={0.38} cy={0.52} r={0.085} h={6} z={20} c={['#ffa63a', '#e07a1a']} />
        <path d={`M${P(0.38, 0.52, 27)[0]} ${P(0.38, 0.52, 27)[1]}q5 -5 9 -2q-3 5 -9 2z`} fill="#6fcf6a" stroke={OL} strokeWidth="1.2" />
        <Cyl cx={0.64} cy={0.44} r={0.07} h={5} z={20} c={['#fffdf7', '#e6dcc6']} />
        {steam(P(0.64, 0.44, 28)[0], P(0.64, 0.44, 28)[1], 0.4)}
      </g>
    ),
  },
  booth: {
    view: '-40 -58 116 100',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.1} />
        <Box x={0} y={0.02} w={2} d={0.26} h={38} c={['#c43a46', '#9c2a3e', '#74203a']} />
        <FaceY x={0} y={0.28}>
          {[8, 24, 40, 56].map((u) => [16, 28].map((v) => <circle key={`${u}-${v}`} cx={u} cy={v + 6} r="1.8" fill="#ffd45e" stroke={OL} strokeWidth="0.8" />))}
          <path d="M2 40H62" stroke="#ffd45e" strokeWidth="1.6" opacity="0.7" />
        </FaceY>
        <Box x={0} y={0.28} w={2} d={0.34} h={14} c={['#e0505e', '#b0304a', '#862640']} />
        <Box x={0.34} y={0.68} w={1.32} d={0.3} h={12} c={WOOD} />
        <Cyl cx={0.8} cy={0.84} r={0.075} h={4} z={12} c={['#fffdf7', '#e6dcc6']} />
        <Cyl cx={1.25} cy={0.84} r={0.075} h={4} z={12} c={['#fffdf7', '#e6dcc6']} />
        {steam(P(1.25, 0.84, 18)[0], P(1.25, 0.84, 18)[1], 0.6)}
      </g>
    ),
  },
  bench: {
    view: '-40 -40 116 84',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.05} />
        <Box x={0.1} y={0.3} w={0.12} d={0.4} h={14} c={DWOOD} />
        <Box x={1.78} y={0.3} w={0.12} d={0.4} h={14} c={DWOOD} />
        <Box x={0.04} y={0.26} w={1.92} d={0.48} h={5} z={14} c={WOOD} />
        <Box x={0.2} y={0.34} w={0.62} d={0.32} h={3} z={19} c={['#e8605a', '#b92d3e', '#8f1f38']} />
        <Box x={1.18} y={0.34} w={0.62} d={0.32} h={3} z={19} c={['#e8605a', '#b92d3e', '#8f1f38']} />
      </g>
    ),
  },
  stove: {
    view: '-34 -62 68 100',
    glow: () => <ellipse cx={P(0.5, 0.9)[0]} cy={P(0.5, 0.9)[1]} rx="52" ry="26" fill="url(#glowWarm)" className="flick" />,
    art: () => {
      const [wx, wy] = P(0.5, 0.5, 29)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.62} />
          <Box x={0.1} y={0.1} w={0.8} d={0.8} h={22} c={IRON} />
          <FaceY x={0.1} y={0.9}>
            <rect x="3" y="4" width="20" height="13" rx="2" fill="#2a2635" stroke={OL} strokeWidth="1.2" />
            <rect x="5" y="6" width="16" height="2.4" fill="#ffb347" className="flick" />
            <rect x="6" y="18" width="14" height="1.6" fill="#c5cde0" />
            {[7, 13, 19].map((u) => <circle key={u} cx={u} cy="20.5" r="0.001" />)}
          </FaceY>
          <Cyl cx={0.5} cy={0.5} r={0.3} h={7} z={22} c={['#1a1624', '#3c384f']} />
          <ellipse cx={wx} cy={wy} rx="19" ry="9" fill="#2f2a3d" stroke={OL} strokeWidth="1.4" />
          {blob(wx - 6, wy - 3, 4, '#6fcf6a', '#3d9b3a', 'a')}
          {blob(wx + 5, wy - 2, 3.6, '#ff8a3d', '#d9601e', 'b')}
          {blob(wx, wy + 2, 3.2, '#ffd45e', '#e0a22a', 'c')}
          {flame(wx - 12, wy + 18, 0.8, 0)}
          {flame(wx + 12, wy + 18, 0.8, -0.4)}
          {steam(wx - 2, wy - 8, 0)}
          {steam(wx + 8, wy - 8, 0.8)}
          <path d={`M${wx + 12} ${wy - 4}L${wx + 28} ${wy - 14}`} stroke={OL} strokeWidth="5" strokeLinecap="round" />
          <path d={`M${wx + 12} ${wy - 4}L${wx + 28} ${wy - 14}`} stroke="#8c6a46" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )
    },
  },
  ricecooker: {
    view: '-34 -62 68 100',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 0)
      const rx = 0.3 * 45.25
      const ry = 0.3 * 22.63
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.55} />
          <Cyl cx={0.5} cy={0.5} r={0.3} h={24} c={['#ffffff', '#f0eaf5']} />
          <path d={`M${bx - rx} ${by - 7}A${rx} ${ry} 0 0 0 ${bx + rx} ${by - 7}`} fill="none" stroke="#e4574a" strokeWidth="5" />
          <path d={`M${bx - rx} ${by - 12}A${rx} ${ry} 0 0 0 ${bx + rx} ${by - 12}`} fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.7" />
          <Cyl cx={0.5} cy={0.5} r={0.315} h={6} z={24} c={['#e8e3ee', '#c9c2d6']} />
          <Cyl cx={0.5} cy={0.5} r={0.06} h={4} z={30} c={['#4b3a63', '#33264a']} />
          <circle cx={bx - 6} cy={by - 15} r="1.9" fill={OL} />
          <circle cx={bx + 6} cy={by - 15} r="1.9" fill={OL} />
          <ellipse cx={bx - 10} cy={by - 11} rx="3" ry="1.8" fill="#ff7d96" opacity="0.6" />
          <ellipse cx={bx + 10} cy={by - 11} rx="3" ry="1.8" fill="#ff7d96" opacity="0.6" />
          <path d={`M${bx - 2.4} ${by - 11}q2.4 2.6 4.8 0`} fill="none" stroke={OL} strokeWidth="1.3" strokeLinecap="round" />
          {steam(bx + 10, by - 34, 0)}
          {steam(bx + 14, by - 34, 1.1)}
        </g>
      )
    },
  },
  sushicase: {
    view: '-40 -58 116 100',
    glow: () => <ellipse cx={P(1, 0.9)[0]} cy={P(1, 0.9)[1]} rx="76" ry="32" fill="url(#glowCyan)" opacity="0.7" />,
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.05} />
        <Box x={0.04} y={0.22} w={1.92} d={0.56} h={14} c={STEEL} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [nx, ny] = P(0.22 + i * 0.3, 0.52, 18)
          return <g key={i}>{nigiri(nx, ny, ['#ff8f66', '#ff6f6f', '#ffd45e', '#ff8f66', '#9fdc62', '#ff6f6f'][i])}</g>
        })}
        <Box x={0.08} y={0.26} w={1.84} d={0.48} h={24} z={14} c={GLASS} sw={1.8} />
        <Box x={0.04} y={0.22} w={1.92} d={0.56} h={3} z={38} c={STEEL} />
        <rect x={P(0.4, 0.78, 12)[0]} y={P(0.4, 0.78, 12)[1] - 4} width="22" height="5" rx="1.5" fill="#d4503b" opacity="0.9" />
      </g>
    ),
  },
  sake: {
    view: '-34 -50 68 90',
    art: () => {
      const [ax, ay] = P(0.34, 0.6, 0)
      const [bx, by] = P(0.7, 0.52, 0)
      return (
        <g>
          <Shadow cx={0.5} cy={0.55} r={0.7} />
          <Cyl cx={0.34} cy={0.6} r={0.25} h={22} c={['#e0b078', '#b88650']} />
          <path d={`M${ax - 11} ${ay - 6}A11 5.6 0 0 0 ${ax + 11} ${ay - 6}M${ax - 11} ${ay - 16}A11 5.6 0 0 0 ${ax + 11} ${ay - 16}`} fill="none" stroke="#5f3a24" strokeWidth="2.2" />
          <rect x={ax - 5} y={ay - 15} width="10" height="9" rx="1.5" fill="#d9363e" stroke={OL} strokeWidth="1.4" />
          <circle cx={ax} cy={ay - 10.5} r="2" fill="#fff" />
          <Cyl cx={0.7} cy={0.52} r={0.23} h={20} c={['#e0b078', '#b88650']} />
          <path d={`M${bx - 10} ${by - 5}A10 5 0 0 0 ${bx + 10} ${by - 5}M${bx - 10} ${by - 14}A10 5 0 0 0 ${bx + 10} ${by - 14}`} fill="none" stroke="#5f3a24" strokeWidth="2.2" />
          <rect x={bx - 4.5} y={by - 14} width="9" height="8" rx="1.5" fill="#2c3a8f" stroke={OL} strokeWidth="1.4" />
          <circle cx={bx} cy={by - 10} r="1.8" fill="#fff" />
          <Cyl cx={0.52} cy={0.5} r={0.14} h={9} z={22} c={['#f0cf96', '#c99a5c']} />
          <path d={`M${P(0.52, 0.5, 31)[0] - 5} ${P(0.52, 0.5, 31)[1]}q5 -6 10 0`} fill="none" stroke="#d9363e" strokeWidth="2" />
        </g>
      )
    },
  },
  conveyor: {
    view: '-40 -40 116 90',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.05} />
        <Box x={0} y={0.2} w={2} d={0.6} h={14} c={STEEL} />
        <polygon points={plane(0.06, 0.26, 1.94, 0.74, 14.5).map((p) => p.join(',')).join(' ')} fill="#33264a" stroke={OL} strokeWidth="1.6" strokeLinejoin="round" />
        {[0.34, 0.5, 0.66].map((y) => (
          <path key={y} d={`M${P(0.1, y, 14.6).join(',')}L${P(1.9, y, 14.6).join(',')}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="5 5" />
        ))}
        <g transform={`translate(${P(0.2, 0.5, 15)[0]} ${P(0.2, 0.5, 15)[1]})`}>
          {[0, -2.3, -4.6].map((d, i) => (
            <g key={i} className="belt" style={{ animationDelay: `${d}s` }}>
              <ellipse cx="0" cy="0" rx="9" ry="4.5" fill="#fffdf7" stroke={OL} strokeWidth="1.4" />
              {nigiri(0, -1, ['#ff8f66', '#ffd45e', '#9fdc62'][i])}
            </g>
          ))}
        </g>
        <Box x={0} y={0.2} w={0.12} d={0.6} h={18} c={DARK} sw={1.6} />
        <Box x={1.88} y={0.2} w={0.12} d={0.6} h={18} c={DARK} sw={1.6} />
      </g>
    ),
  },
  ramencart: {
    view: '-36 -78 72 112',
    glow: () => <ellipse cx={P(0.5, 0.95)[0]} cy={P(0.5, 0.95)[1]} rx="62" ry="30" fill="url(#glowWarm)" className="flick" />,
    art: () => {
      const [lx, ly] = P(0.86, 0.9, 46)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.7} />
          <ellipse cx={P(0.2, 0.9)[0]} cy={P(0.2, 0.9)[1] - 3} rx="6" ry="6" fill="#33264a" stroke={OL} strokeWidth="1.8" />
          <ellipse cx={P(0.85, 0.2)[0]} cy={P(0.85, 0.2)[1] - 3} rx="6" ry="6" fill="#33264a" stroke={OL} strokeWidth="1.8" />
          <Box x={0.14} y={0.22} w={0.72} d={0.56} h={22} c={RED} sw={2.2} />
          <Box x={0.1} y={0.18} w={0.8} d={0.64} h={3} z={22} c={WOOD} />
          {[[0.12, 0.2], [0.84, 0.2], [0.12, 0.78], [0.84, 0.78]].map(([x, y], i) => <Box key={i} x={x} y={y} w={0.04} d={0.04} h={30} z={25} c={DWOOD} sw={1.2} />)}
          <Box x={0.06} y={0.14} w={0.88} d={0.72} h={5} z={55} c={['#e85a54', '#b92d3e', '#8f1f38']} />
          <FaceY x={0.06} y={0.86} z={39}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={2 + i * 6.6} y="0" width="5.8" height="16" fill={i % 2 ? '#fffdf7' : '#2c3a8f'} stroke={OL} strokeWidth="1" />
              </g>
            ))}
          </FaceY>
          <Cyl cx={0.4} cy={0.5} r={0.11} h={5} z={25} c={['#fffdf7', '#e6dcc6']} />
          <ellipse cx={P(0.4, 0.5, 31)[0]} cy={P(0.4, 0.5, 31)[1]} rx="6" ry="3" fill="#e8b878" />
          {steam(P(0.4, 0.5, 33)[0], P(0.4, 0.5, 33)[1], 0)}
          <circle cx={lx} cy={ly + 6} r="14" fill="url(#glowWarm)" className="flick" />
          <ellipse cx={lx} cy={ly + 6} rx="5.4" ry="7" fill="#ff7a45" stroke={OL} strokeWidth="1.6" />
        </g>
      )
    },
  },
  daruma: {
    view: '-30 -52 60 90',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 0)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.5} />
          <ellipse cx={bx} cy={by - 16} rx="17" ry="18" fill="#c52f34" stroke={OL} strokeWidth="2.4" />
          <ellipse cx={bx - 5} cy={by - 20} rx="9" ry="12" fill="#e8484a" opacity="0.8" />
          <path d={`M${bx - 13} ${by - 6}q13 8 26 0M${bx - 11} ${by - 1}q11 6 22 0`} fill="none" stroke="#ffd45e" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx={bx} cy={by - 26} rx="11" ry="9" fill="#fff4e0" stroke={OL} strokeWidth="2" />
          <path d={`M${bx - 9} ${by - 33}q4 -4 8 0M${bx + 1} ${by - 33}q4 -4 8 0`} fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={bx - 4.6} cy={by - 27} r="2.6" fill="#fff" stroke={OL} strokeWidth="1.4" />
          <circle cx={bx - 4.6} cy={by - 27} r="1.6" fill={OL} />
          <circle cx={bx + 4.6} cy={by - 27} r="2.6" fill="#fff" stroke={OL} strokeWidth="1.4" />
          <path d={`M${bx - 8} ${by - 21}q-3 5 -7 4M${bx + 8} ${by - 21}q3 5 7 4`} fill="none" stroke={OL} strokeWidth="1.6" strokeLinecap="round" />
          <path d={`M${bx - 3} ${by - 20}q3 2 6 0`} fill="none" stroke={OL} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )
    },
  },
  screen: {
    view: '-40 -76 116 112',
    art: () => (
      <g>
        <Shadow cx={1} cy={0.5} r={1.0} />
        <Box x={0.2} y={0.4} w={0.14} d={0.18} h={5} c={DWOOD} sw={1.6} />
        <Box x={1.66} y={0.4} w={0.14} d={0.18} h={5} c={DWOOD} sw={1.6} />
        <Box x={0.04} y={0.44} w={1.92} d={0.08} h={64} z={4} c={['#7a4e30', '#5f3a24', '#4a2c1a']} />
        <FaceY x={0.04} y={0.52} z={4}>
          <rect x="3" y="3" width="55" height="58" fill="#fbf0d4" />
          <path d="M3 24Q14 40 24 26T44 32T58 22V3H3Z" fill="#a8bcdc" opacity="0.9" />
          <path d="M3 14Q18 28 30 16T58 12V3H3Z" fill="#c9d6ec" opacity="0.9" />
          <circle cx="46" cy="46" r="7" fill="#ffc86b" />
          <path d="M14 36q8 -6 16 -2" fill="none" stroke="#3a2a52" strokeWidth="1.4" />
          <ellipse cx="22" cy="38" rx="6" ry="2.6" fill="#fff" stroke={OL} strokeWidth="1" />
          <path d="M27 38q5 -8 7 -12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="35" cy="25" r="1.8" fill="#e63a3a" />
          <path d="M16 40l-3 8M20 40l-2 8" stroke={OL} strokeWidth="1" />
          <path d="M8 56q10 -3 16 -10" fill="none" stroke="#4a8a4a" strokeWidth="1.8" />
        </FaceY>
      </g>
    ),
  },
  fox: {
    view: '-30 -78 60 112',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 12)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.55} />
          <Box x={0.2} y={0.2} w={0.6} d={0.6} h={12} c={STONE} />
          <path d={`M${bx + 12} ${by - 6}c14 -2 16 -16 8 -26c2 12 -6 16 -12 14z`} fill="#fffdf7" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx={bx} cy={by - 16} rx="13" ry="17" fill="#fffdf7" stroke={OL} strokeWidth="2.2" />
          <ellipse cx={bx + 4} cy={by - 12} rx="6" ry="12" fill="#ece3d2" opacity="0.7" />
          <path d={`M${bx - 11} ${by - 18}q11 8 22 0l-3 10q-8 4 -16 0z`} fill="#d9363e" stroke={OL} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx={bx} cy={by - 12} r="3" fill="#ffd23a" stroke={OL} strokeWidth="1.4" />
          <ellipse cx={bx} cy={by - 38} rx="11" ry="9" fill="#fffdf7" stroke={OL} strokeWidth="2.2" />
          <path d={`M${bx - 9} ${by - 42}L${bx - 12} ${by - 56}L${bx - 3} ${by - 46}ZM${bx + 9} ${by - 42}L${bx + 12} ${by - 56}L${bx + 3} ${by - 46}Z`} fill="#fffdf7" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${bx - 9} ${by - 46}L${bx - 10} ${by - 52}L${bx - 5} ${by - 47}ZM${bx + 9} ${by - 46}L${bx + 10} ${by - 52}L${bx + 5} ${by - 47}Z`} fill="#d9363e" />
          <path d={`M${bx - 7} ${by - 40}q2 2 4 0M${bx + 3} ${by - 40}q2 2 4 0`} fill="none" stroke={OL} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M${bx - 2.4} ${by - 35}l2.4 2.6l2.4 -2.6z`} fill={OL} />
          <path d={`M${bx - 10} ${by - 34}l-8 2M${bx + 10} ${by - 34}l8 2`} stroke="#d9363e" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )
    },
  },
  clock: {
    view: '-34 -98 68 132',
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.5} />
        <Box x={0.26} y={0.3} w={0.48} d={0.4} h={80} c={DWOOD} />
        <Box x={0.2} y={0.26} w={0.6} d={0.48} h={5} z={80} c={WOOD} />
        <Box x={0.3} y={0.3} w={0.4} d={0.4} h={5} z={85} c={DWOOD} sw={1.8} />
        <Box x={0.2} y={0.26} w={0.6} d={0.48} h={5} c={WOOD} />
        <FaceY x={0.26} y={0.7}>
          <circle cx="7.7" cy="64" r="6.4" fill="#fff6e0" stroke={OL} strokeWidth="1.4" />
          {[0, 90, 180, 270].map((a) => <line key={a} x1="7.7" y1="64" x2="7.7" y2="58.8" stroke={OL} strokeWidth="0.9" transform={`rotate(${a} 7.7 64)`} />)}
          <line x1="7.7" y1="64" x2="7.7" y2="59.5" stroke={OL} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="7.7" y1="64" x2="11" y2="64" stroke={OL} strokeWidth="1.1" strokeLinecap="round" />
          <rect x="3" y="10" width="9.4" height="40" rx="1.5" fill="#2a1d2e" stroke={OL} strokeWidth="1.2" />
          <g className="pend">
            <line x1="7.7" y1="48" x2="7.7" y2="22" stroke="#e8c88c" strokeWidth="1" />
            <circle cx="7.7" cy="20" r="3" fill="#ffd45e" stroke={OL} strokeWidth="1" />
          </g>
        </FaceY>
      </g>
    ),
  },
  arcade: {
    view: '-34 -88 68 124',
    glow: () => <ellipse cx={P(0.5, 0.95)[0]} cy={P(0.5, 0.95)[1]} rx="64" ry="30" fill="url(#glowCyan)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.55} />
        <Box x={0.16} y={0.22} w={0.68} d={0.56} h={66} c={NAVY} />
        <Box x={0.16} y={0.22} w={0.68} d={0.56} h={8} z={66} c={['#ff9fd0', '#e0509a', '#b03a7a']} sw={2} />
        <Box x={0.16} y={0.5} w={0.68} d={0.34} h={5} z={28} c={['#4a4f9f', '#3a3f8f', '#2a2f6e']} sw={1.8} />
        <FaceY x={0.16} y={0.78}>
          <rect x="2.5" y="34" width="16.8" height="26" rx="1.5" fill="#0c0a22" stroke="#7fe6ff" strokeWidth="1.2" style={{ filter: 'url(#neon)' }} />
          <g className="flick">
            {[[6, 52], [10, 52], [14, 52], [8, 49], [12, 49], [6, 46], [10, 46], [14, 46], [8, 43], [12, 43]].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="3" height="2.4" fill="#6dffc0" />
            ))}
          </g>
          <rect x="4" y="38" width="14" height="1.6" fill="#ff7fc0" opacity="0.8" />
          <rect x="2.5" y="8" width="16.8" height="6" rx="1" fill="#1f2352" stroke={OL} strokeWidth="1" />
        </FaceY>
        <circle cx={P(0.4, 0.78, 33)[0]} cy={P(0.4, 0.78, 33)[1]} r="2.6" fill="#ff5b6e" stroke={OL} strokeWidth="1.2" />
        <circle cx={P(0.6, 0.8, 32)[0]} cy={P(0.6, 0.8, 32)[1]} r="1.8" fill="#ffd23a" stroke={OL} strokeWidth="1" />
        <circle cx={P(0.68, 0.8, 32)[0]} cy={P(0.68, 0.8, 32)[1]} r="1.8" fill="#6dffc0" stroke={OL} strokeWidth="1" />
      </g>
    ),
  },
  jukebox: {
    view: '-34 -88 68 124',
    glow: () => <ellipse cx={P(0.5, 0.95)[0]} cy={P(0.5, 0.95)[1]} rx="62" ry="30" fill="url(#glowPink)" className="flick" />,
    art: () => {
      const [nx, ny] = P(0.5, 0.5, 66)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.55} />
          <Box x={0.18} y={0.24} w={0.64} d={0.5} h={58} c={['#e8604a', '#c03e34', '#962c2c']} />
          <Box x={0.18} y={0.24} w={0.64} d={0.5} h={6} z={58} c={GOLD} sw={2} />
          <FaceY x={0.18} y={0.74}>
            <path d="M3 24V46A7.2 7.2 0 0 1 17.4 46V24Z" fill="#1a1230" stroke={OL} strokeWidth="1.2" />
            <g style={{ filter: 'url(#neon)' }} className="flick">
              <path d="M5 26V46A5.2 5.2 0 0 1 15.4 46V26" fill="none" stroke="#ff7fc0" strokeWidth="1.4" />
              <path d="M7.4 26V46A2.8 2.8 0 0 1 13 46V26" fill="none" stroke="#7fe6ff" strokeWidth="1.2" />
            </g>
            <circle cx="10.2" cy="38" r="3.4" fill="#2a2f6e" stroke="#ffd23a" strokeWidth="0.9" />
            <circle cx="10.2" cy="38" r="0.9" fill="#ffd23a" />
            {[8, 11, 14].map((v) => <line key={v} x1="3.5" y1={v} x2="16.5" y2={v} stroke="#ffd45e" strokeWidth="0.9" opacity="0.7" />)}
          </FaceY>
          {[0, 1].map((i) => (
            <text key={i} className="note" style={{ animationDelay: `${-i * 1.4}s` }} x={nx - 6 + i * 12} y={ny - 4} fontSize="11" fill={i ? '#7fe6ff' : '#ff7fc0'} fontWeight="800">♪</text>
          ))}
        </g>
      )
    },
  },
  stonelantern: {
    view: '-34 -74 68 108',
    glow: () => <ellipse cx={P(0.5, 0.5)[0]} cy={P(0.5, 0.5)[1]} rx="52" ry="26" fill="url(#glowWarm)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.55} />
        <Box x={0.26} y={0.26} w={0.48} d={0.48} h={8} c={STONE} />
        <Box x={0.4} y={0.4} w={0.2} d={0.2} h={14} z={8} c={STONE} />
        <Box x={0.28} y={0.28} w={0.44} d={0.44} h={5} z={22} c={STONE} />
        <Box x={0.34} y={0.34} w={0.32} d={0.32} h={14} z={27} c={['#ffe9a8', '#ffcf6b', '#e0a640']} sw={2} />
        <Box x={0.18} y={0.18} w={0.64} d={0.64} h={6} z={41} c={STONE} />
        <Box x={0.32} y={0.32} w={0.36} d={0.36} h={6} z={47} c={STONE} />
        <circle cx={P(0.5, 0.5, 57)[0]} cy={P(0.5, 0.5, 57)[1]} r="3.4" fill="#cfcbd6" stroke={OL} strokeWidth="1.6" />
        {blob(P(0.32, 0.7, 4)[0], P(0.32, 0.7, 4)[1], 4, '#6fcf6a', '#3d9b3a', 'm1')}
        {blob(P(0.72, 0.62, 3)[0], P(0.72, 0.62, 3)[1], 3.2, '#7fe074', '#43a640', 'm2')}
      </g>
    ),
  },
  maple: {
    view: '-46 -112 92 152',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 0)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.7} />
          <Box x={0.42} y={0.42} w={0.16} d={0.16} h={40} c={['#8a5a3a', '#6e4429', '#52301c']} />
          {blob(bx - 22, by - 54, 17, '#ff8a4a', '#d9501e', 1)}
          {blob(bx + 20, by - 56, 18, '#ff6a3d', '#c93a1a', 2)}
          {blob(bx, by - 70, 20, '#ff9a5a', '#e0602a', 3)}
          {blob(bx - 8, by - 46, 15, '#e8452a', '#b02a14', 4)}
          {blob(bx + 12, by - 44, 13, '#ff7a3a', '#c9441f', 5)}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} className="petal2" style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${6 + i}s` }} d={`M${bx - 24 + i * 16} ${by - 50}l2 -3l2 3l-2 3z`} fill="#ff7a3a" stroke="#c93a1a" strokeWidth="0.8" />
          ))}
        </g>
      )
    },
  },
  bamboo: {
    view: '-34 -96 68 130',
    art: () => {
      const stalk = (x: number, y: number, h: number, key: number) => {
        const [sx, sy] = P(x, y, 0)
        return (
          <g key={key} className="bsway" style={{ transformOrigin: `${sx}px ${sy}px`, animationDelay: `${-key * 0.9}s` }}>
            <rect x={sx - 3.4} y={sy - h} width="6.8" height={h} rx="3" fill="#8ccf5a" stroke={OL} strokeWidth="2" />
            <rect x={sx - 1.6} y={sy - h + 2} width="2" height={h - 4} rx="1" fill="#c8f09a" opacity="0.7" />
            {Array.from({ length: Math.floor(h / 16) }, (_, i) => <line key={i} x1={sx - 3.4} y1={sy - 14 - i * 16} x2={sx + 3.4} y2={sy - 14 - i * 16} stroke={OL} strokeWidth="1.6" />)}
            <path d={`M${sx} ${sy - h + 4}q10 -4 16 4q-8 4 -16 -4M${sx} ${sy - h + 10}q-10 -3 -16 4q8 4 16 -4M${sx} ${sy - h + 16}q9 -2 14 6`} fill="#5fb84a" stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />
          </g>
        )
      }
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.6} />
          {stalk(0.3, 0.4, 70, 0)}
          {stalk(0.62, 0.36, 86, 1)}
          {stalk(0.5, 0.62, 60, 2)}
          {stalk(0.76, 0.66, 74, 3)}
        </g>
      )
    },
  },
  fountain: {
    view: '-34 -62 68 100',
    art: () => {
      const [bx, by] = P(0.5, 0.5, 14)
      return (
        <g>
          <Shadow cx={0.5} cy={0.5} r={0.7} />
          <Cyl cx={0.5} cy={0.55} r={0.36} h={14} c={['#7fd0ee', '#a9a3b4']} />
          <ellipse cx={bx} cy={by + 3} rx="22" ry="10.5" fill="url(#water)" stroke={OL} strokeWidth="1.6" />
          <ellipse className="ripple" cx={bx} cy={by + 3} rx="14" ry="6" fill="none" stroke="#fff" strokeWidth="1.2" />
          <Box x={0.14} y={0.46} w={0.1} d={0.1} h={26} c={DWOOD} sw={1.8} />
          <g className="tip" style={{ transformOrigin: `${P(0.19, 0.51, 24)[0]}px ${P(0.19, 0.51, 24)[1]}px` }}>
            <path d={`M${P(0.19, 0.51, 24)[0] - 6} ${P(0.19, 0.51, 24)[1] - 6}l22 10`} stroke={OL} strokeWidth="9" strokeLinecap="round" />
            <path d={`M${P(0.19, 0.51, 24)[0] - 6} ${P(0.19, 0.51, 24)[1] - 6}l22 10`} stroke="#8ccf5a" strokeWidth="5.4" strokeLinecap="round" />
          </g>
          <path className="drip" d={`M${P(0.19, 0.51, 24)[0] + 16} ${P(0.19, 0.51, 24)[1] + 6}v10`} stroke="#8fe9ff" strokeWidth="2" strokeLinecap="round" />
          {blob(P(0.8, 0.8, 14)[0], P(0.8, 0.8, 14)[1], 5, '#cfcbd6', '#9a94a8', 'f1')}
        </g>
      )
    },
  },
  rockgarden: {
    view: '-40 -34 116 80',
    art: () => {
      const rocks: [number, number, number][] = [[0.5, 0.45, 8], [1.15, 0.6, 6.5], [1.62, 0.36, 5]]
      return (
        <g>
          <Shadow cx={1} cy={0.5} r={1.05} />
          <Box x={0.02} y={0.06} w={1.96} d={0.88} h={5} c={['#f6eeda', '#e0d4b8', '#c8b894']} />
          <Box x={0.02} y={0.06} w={1.96} d={0.06} h={8} c={DWOOD} sw={1.8} />
          <Box x={0.02} y={0.88} w={1.96} d={0.06} h={8} c={DWOOD} sw={1.8} />
          {[0.28, 0.4, 0.52, 0.64, 0.76].map((y, i) => (
            <path key={i} d={`M${P(0.16, y, 5.4).join(',')}Q${P(0.7, y + 0.06 * (i % 2 ? -1 : 1), 5.4).join(',')} ${P(1.2, y, 5.4).join(',')}T${P(1.86, y, 5.4).join(',')}`} fill="none" stroke="rgba(160,140,100,0.55)" strokeWidth="1.2" />
          ))}
          {rocks.map(([x, y, r], i) => {
            const [rx, ry] = P(x, y, 5)
            return (
              <g key={i}>
                <ellipse cx={rx} cy={ry + 1} rx={r * 1.9} ry={r * 0.95} fill="none" stroke="rgba(160,140,100,0.6)" strokeWidth="1.2" />
                {blob(rx, ry - r * 0.5, r, '#cfcbd6', '#8a8498', `k${i}`)}
              </g>
            )
          })}
        </g>
      )
    },
  },
  andon: {
    view: '-30 -66 60 106',
    glow: () => <ellipse cx={P(0.5, 0.5)[0]} cy={P(0.5, 0.5)[1] + 4} rx="66" ry="34" fill="url(#glowWarm)" className="flick" />,
    art: () => (
      <g>
        <Shadow cx={0.5} cy={0.5} r={0.45} />
        <Box x={0.28} y={0.28} w={0.44} d={0.44} h={8} c={DWOOD} />
        <Box x={0.32} y={0.32} w={0.36} d={0.36} h={34} z={8} c={['#fff6d0', '#ffe3a0', '#f0bf68']} sw={2} />
        <FaceY x={0.32} y={0.68} z={8}>
          <line x1="5.8" y1="2" x2="5.8" y2="32" stroke="#8a5a3a" strokeWidth="1.2" />
          <line x1="2" y1="17" x2="9.6" y2="17" stroke="#8a5a3a" strokeWidth="1.2" />
          <rect x="1.2" y="1.2" width="9.2" height="31.6" fill="none" stroke="#7a4e30" strokeWidth="1.4" />
        </FaceY>
        <Box x={0.26} y={0.26} w={0.48} d={0.48} h={5} z={42} c={DWOOD} />
        <Box x={0.38} y={0.38} w={0.24} d={0.24} h={4} z={47} c={DWOOD} sw={1.8} />
      </g>
    ),
  },

  // ---- rugs: lie on the floor, under furniture ----
  rugred: {
    view: '-46 -10 92 90',
    art: () => (
      <g>
        {poly(plane(0.06, 0.06, 1.94, 1.94, 1.2), '#c43a4a')}
        {poly(plane(0.22, 0.22, 1.78, 1.78, 1.3), '#8f1f38', '#ffd45e', 2.4)}
        {poly(plane(0.34, 0.34, 1.66, 1.66, 1.4), '#d9505a', 'rgba(255,214,130,0.6)', 1.2)}
        {poly([P(1, 0.5, 1.5), P(1.5, 1, 1.5), P(1, 1.5, 1.5), P(0.5, 1, 1.5)], '#ffd45e', OL, 1.6)}
        {poly([P(1, 0.7, 1.6), P(1.3, 1, 1.6), P(1, 1.3, 1.6), P(0.7, 1, 1.6)], '#c43a4a', OL, 1.2)}
        {[0.3, 0.55, 0.8, 1.05, 1.3, 1.55, 1.8].map((v) => (
          <g key={v}>
            <line x1={P(0.06, v, 1.2)[0]} y1={P(0.06, v, 1.2)[1]} x2={P(-0.03, v, 1.2)[0]} y2={P(-0.03, v, 1.2)[1]} stroke="#ffe9a0" strokeWidth="1.4" />
            <line x1={P(v, 1.94, 1.2)[0]} y1={P(v, 1.94, 1.2)[1]} x2={P(v, 2.03, 1.2)[0]} y2={P(v, 2.03, 1.2)[1]} stroke="#ffe9a0" strokeWidth="1.4" />
          </g>
        ))}
      </g>
    ),
  },
  rugwave: {
    view: '-46 -10 92 90',
    art: () => {
      const arcs: ReactNode[] = []
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const x = 0.2 + c * 0.23 + (r % 2) * 0.115
          const y = 0.2 + r * 0.23
          if (x > 1.85 || y > 1.85) continue
          const [px, py] = P(x, y, 1.5)
          arcs.push(<ellipse key={`${r}-${c}`} cx={px} cy={py} rx="8" ry="4" fill="none" stroke="#7fb4f0" strokeWidth="1.1" opacity="0.8" />, <ellipse key={`b${r}-${c}`} cx={px} cy={py} rx="4.6" ry="2.3" fill="none" stroke="#bcd8ff" strokeWidth="1" opacity="0.7" />)
        }
      }
      return (
        <g>
          {poly(plane(0.06, 0.06, 1.94, 1.94, 1.2), '#27388a')}
          <clipPath id="clipWave"><polygon points={plane(0.1, 0.1, 1.9, 1.9, 1.4).map((p) => p.join(',')).join(' ')} /></clipPath>
          <g clipPath="url(#clipWave)">{arcs}</g>
          {poly(plane(0.12, 0.12, 1.88, 1.88, 1.5), 'none', '#ffd45e', 2)}
        </g>
      )
    },
  },
  rugsakura: {
    view: '-46 -10 92 90',
    art: () => {
      const petals: ReactNode[] = []
      for (let i = 0; i < 26; i++) {
        const x = 0.2 + ((i * 0.37) % 1.6)
        const y = 0.2 + ((i * 0.53) % 1.6)
        const [px, py] = P(x, y, 1.5)
        petals.push(<ellipse key={i} cx={px} cy={py} rx="3.4" ry="1.7" fill={i % 3 ? '#ffd0e0' : '#fff'} stroke="#e07aa0" strokeWidth="0.7" transform={`rotate(${(i * 47) % 180} ${px} ${py})`} />)
      }
      return (
        <g>
          {poly(plane(0.06, 0.06, 1.94, 1.94, 1.2), '#f3a0c0')}
          {poly(plane(0.2, 0.2, 1.8, 1.8, 1.3), '#ffbfd6', '#fff', 2)}
          {petals}
          {poly([P(1, 0.7, 1.6), P(1.3, 1, 1.6), P(1, 1.3, 1.6), P(0.7, 1, 1.6)], '#fff0f5', '#e07aa0', 1.4)}
        </g>
      )
    },
  },
  runner: {
    view: '-46 -10 112 70',
    art: () => (
      <g>
        {poly(plane(0.04, 0.12, 2.96, 0.88, 1.2), '#b92d3e')}
        {poly(plane(0.12, 0.2, 2.88, 0.8, 1.3), '#d9505a', '#fff2d0', 2)}
        {[0.4, 1.5, 2.6].map((x) => <g key={x}>{poly([P(x, 0.5, 1.5), P(x + 0.22, 0.34, 1.5), P(x + 0.44, 0.5, 1.5), P(x + 0.22, 0.66, 1.5)], '#ffd45e', OL, 1.2)}</g>)}
        {[0.2, 0.34, 0.48, 0.62, 0.76].map((y) => (
          <g key={y}>
            <line x1={P(0.04, y, 1.2)[0]} y1={P(0.04, y, 1.2)[1]} x2={P(-0.04, y, 1.2)[0]} y2={P(-0.04, y, 1.2)[1]} stroke="#ffe9a0" strokeWidth="1.3" />
            <line x1={P(2.96, y, 1.2)[0]} y1={P(2.96, y, 1.2)[1]} x2={P(3.04, y, 1.2)[0]} y2={P(3.04, y, 1.2)[1]} stroke="#ffe9a0" strokeWidth="1.3" />
          </g>
        ))}
      </g>
    ),
  },
}
