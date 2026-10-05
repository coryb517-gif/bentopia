import type { ReactNode } from 'react'
import { OL } from './iso'
import type { WallItem } from './restaurant'

/**
 * Wall decor is drawn in wall-plane pixels: u is along the wall (0 = the slot's centre) and v is up
 * (y grows upward). Text is flipped back upright with scale(1 -1).
 */
export interface WallArt {
  draw: () => ReactNode
  /** Preview viewBox with y flipped (see WallPreview). */
  view: string
}

const bottle = (x: number, base: string, shade: string, h: number) => (
  <g>
    <rect x={x - 3.6} y={68} width="7.2" height={h} rx="2.4" fill={base} stroke={OL} strokeWidth="1.5" />
    <rect x={x - 1.6} y={68 + h - 1} width="3.2" height="7" rx="1" fill={shade} stroke={OL} strokeWidth="1.2" />
    <rect x={x - 3.6} y={72} width="7.2" height="6" fill="#fff6e0" opacity="0.9" />
    <rect x={x - 2.4} y={69} width="1.6" height={h - 4} fill="#fff" opacity="0.35" />
  </g>
)

const doll = (x: number, h: number, kimono: string, dot: string) => (
  <g>
    <rect x={x - 3.8} y={68} width="7.6" height={h} rx="3.4" fill={kimono} stroke={OL} strokeWidth="1.4" />
    <path d={`M${x - 3} ${70 + h * 0.4}h6`} stroke={dot} strokeWidth="1.4" />
    <circle cx={x} cy={68 + h + 3.4} r="4.4" fill="#ffe1c4" stroke={OL} strokeWidth="1.4" />
    <path d={`M${x - 4.2} ${68 + h + 4.4}q4.2 -7 8.4 0q-4.2 -2 -8.4 0z`} fill="#2a1d2e" />
    <circle cx={x - 1.5} cy={68 + h + 2.6} r="0.6" fill={OL} />
    <circle cx={x + 1.5} cy={68 + h + 2.6} r="0.6" fill={OL} />
    <circle cx={x} cy={68 + h + 0.8} r="0.7" fill="#e63a3a" />
  </g>
)

const shelfPlank = (w: number) => (
  <g>
    <rect x={-w} y={62} width={w * 2} height="6" rx="1.4" fill="#c99a5c" stroke={OL} strokeWidth="1.6" />
    <rect x={-w + 2} y={63.5} width={w * 2 - 4} height="1.6" fill="#e9c18a" />
    <path d={`M${-w + 3} 62v-6l6 6zM${w - 3} 62v-6l-6 6z`} fill="#7a4e30" stroke={OL} strokeWidth="1.2" strokeLinejoin="round" />
  </g>
)

export const WALL_ART: Record<WallItem, WallArt> = {
  scroll: {
    view: '-14 -108 28 70',
    draw: () => (
      <g>
        <line x1="0" y1="104" x2="0" y2="99" stroke={OL} strokeWidth="1.4" />
        <rect x="-9.5" y="97" width="19" height="3.6" rx="1.6" fill="#7a4e30" stroke={OL} strokeWidth="1.4" />
        <rect x="-7.6" y="57" width="15.2" height="40" fill="#fbf0d4" stroke={OL} strokeWidth="1.4" />
        <rect x="-9.5" y="53.4" width="19" height="3.8" rx="1.8" fill="#7a4e30" stroke={OL} strokeWidth="1.4" />
        <path d="M-2 92q5 -2 4 3q-2 3 -5 -1q-2 -4 3 -6M1 84q-5 2 -2 6q3 2 4 -3M-1 77q6 -1 5 4q-3 4 -6 -1M0 67q-4 3 -1 6q4 1 3 -4" fill="none" stroke="#2a1d2e" strokeWidth="2" strokeLinecap="round" />
        <rect x="2" y="59" width="4.4" height="4.4" rx="0.8" fill="#d9363e" />
      </g>
    ),
  },
  furin: {
    view: '-14 -108 28 70',
    draw: () => (
      <g>
        <circle cx="0" cy="105" r="1.8" fill="#7a4e30" stroke={OL} strokeWidth="1" />
        <line x1="0" y1="104" x2="0" y2="93" stroke={OL} strokeWidth="1.2" />
        <path d="M-9 84Q-9 98 0 98Q9 98 9 84Z" fill="#bfe8ff" fillOpacity="0.75" stroke={OL} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M-6 90q1 -4 4 -5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="3" cy="91" r="1.6" fill="#ff7fb0" /><circle cx="-3" cy="87" r="1.2" fill="#6dffc0" />
        <ellipse cx="0" cy="84" rx="9" ry="1.8" fill="#9fd4ee" stroke={OL} strokeWidth="1.2" />
        <line x1="0" y1="84" x2="0" y2="76" stroke={OL} strokeWidth="1.2" />
        <g className="fsway" style={{ transformBox: 'fill-box', transformOrigin: '50% 0' }}>
          <rect x="-3.4" y="52" width="6.8" height="24" rx="1" fill="#ffc4d6" stroke={OL} strokeWidth="1.4" />
          <path d="M-1.4 58v12M1.4 56v14" stroke="#e0709a" strokeWidth="1" />
        </g>
      </g>
    ),
  },
  poster: {
    view: '-16 -108 32 70',
    draw: () => (
      <g>
        <rect x="-12.5" y="52" width="25" height="48" fill="#1c2260" stroke={OL} strokeWidth="1.8" />
        <rect x="-10.5" y="54" width="21" height="44" fill="none" stroke="#ffd45e" strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="82" x2={Math.cos((i / 12) * 6.283) * 9.5} y2={82 + Math.sin((i / 12) * 6.283) * 9.5} stroke={['#ffd45e', '#ff7fb0', '#7fe6ff'][i % 3]} strokeWidth="1.8" strokeLinecap="round" />)}
        <circle cx="0" cy="82" r="2.4" fill="#fff" />
        {[[-7, 92], [8, 90], [-8, 73], [9, 74]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill={['#ffd45e', '#7fe6ff'][i % 2]} />)}
        <rect x="-9" y="62" width="18" height="4" fill="#e63a3a" />
        <rect x="-7" y="56" width="14" height="3" fill="#fff6e0" opacity="0.9" />
      </g>
    ),
  },
  mask: {
    view: '-16 -108 32 70',
    draw: () => (
      <g>
        <rect x="-13" y="52" width="26" height="46" rx="3" fill="#5f3a24" stroke={OL} strokeWidth="1.8" />
        <path d="M-8 90L-11 100L-3 93ZM8 90L11 100L3 93Z" fill="#fff6e0" stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />
        <ellipse cx="0" cy="75" rx="10.5" ry="13" fill="#d9363e" stroke={OL} strokeWidth="1.8" />
        <ellipse cx="-3" cy="80" rx="4" ry="7" fill="#f0584a" opacity="0.7" />
        <path d="M-8 82q4 -5 7 -1M8 82q-4 -5 -7 -1" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="-4.6" cy="78" r="2.4" fill="#ffd23a" stroke={OL} strokeWidth="1.2" /><circle cx="4.6" cy="78" r="2.4" fill="#ffd23a" stroke={OL} strokeWidth="1.2" />
        <circle cx="-4.6" cy="78" r="0.9" fill={OL} /><circle cx="4.6" cy="78" r="0.9" fill={OL} />
        <path d="M-1.4 74l1.4 -3l1.4 3z" fill="#b02a30" />
        <path d="M-6 66q6 4 12 0l-1.6 4h-8.8z" fill="#2a1d2e" />
        <path d="M-4.6 66l1.2 3l1.2 -3M3.4 66l1.2 3l1.2 -3" fill="#fff" stroke={OL} strokeWidth="0.8" />
      </g>
    ),
  },
  wallclock: {
    view: '-20 -100 40 56',
    draw: () => (
      <g>
        <circle cx="0" cy="78" r="15" fill="#150f2a" stroke={OL} strokeWidth="2" />
        <g className="flick" style={{ filter: 'url(#neon)' }}>
          <circle cx="0" cy="78" r="13" fill="none" stroke="#ff7fc0" strokeWidth="2.4" />
          <circle cx="0" cy="78" r="9.6" fill="none" stroke="#7fe6ff" strokeWidth="1" opacity="0.8" />
        </g>
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="90" x2="0" y2={i % 3 ? 89 : 88} stroke="#fff6e0" strokeWidth="1.2" transform={`rotate(${i * 30} 0 78)`} />)}
        <line x1="0" y1="78" x2="0" y2="86" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="78" x2="5.6" y2="75" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="78" r="1.4" fill="#ffd23a" />
      </g>
    ),
  },
  shelf: {
    view: '-20 -92 40 44',
    draw: () => (
      <g>
        {shelfPlank(16)}
        {bottle(-9, '#5fb84a', '#3d9b3a', 18)}
        {bottle(-1, '#e8a64a', '#c07a22', 15)}
        {bottle(7, '#6fa6f0', '#3f6fd8', 19)}
        <rect x="11" y="68" width="7" height="8" rx="1.6" fill="#fffdf7" stroke={OL} strokeWidth="1.4" />
        <rect x="10.4" y="75.4" width="8.2" height="2.6" rx="1" fill="#d9363e" stroke={OL} strokeWidth="1.2" />
      </g>
    ),
  },
  kokeshi: {
    view: '-20 -92 40 44',
    draw: () => (
      <g>
        {shelfPlank(17)}
        {doll(-10, 12, '#e63a3a', '#ffd45e')}
        {doll(0, 15, '#3b6fd8', '#fff6e0')}
        {doll(10, 11, '#f0a0c0', '#ffffff')}
      </g>
    ),
  },
  neonramen: {
    view: '-24 -100 48 54',
    draw: () => (
      <g>
        <rect x="-21" y="58" width="42" height="40" rx="5" fill="#150f2a" stroke={OL} strokeWidth="2" />
        <g className="flick neon-t" style={{ filter: 'url(#neon)' }}>
          <rect x="-18" y="61" width="36" height="34" rx="3.4" fill="none" stroke="#7fe6ff" strokeWidth="1.2" />
          <g transform="scale(1 -1)"><text x="0" y="-70" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="'Mochiy Pop One', sans-serif" fill="#ff7fc0">RAMEN</text></g>
          <path d="M-9 80q9 -9 18 0q-1 8 -9 8t-9 -8z" fill="none" stroke="#ffd23a" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M-5 84q2 -3 4 0t4 0" fill="none" stroke="#ff7fc0" strokeWidth="1.2" />
          <path d="M5 79l8 -9M8 79l8 -9" stroke="#fff6e0" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
    ),
  },
}
