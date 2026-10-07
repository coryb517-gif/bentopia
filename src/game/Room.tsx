import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import CustomerPortrait, { ASHLYNDIA, CUSTOMERS } from './Customers'
import { DECOR } from './decor'
import { Box, OL, P } from './iso'
import Mascot from './Mascot'
import {
  canPlace, canPlaceWall, fixedSlots, footprint, itemDef, seats, type Placed, type FloorId, type FloorItem, type ItemType, type Restaurant, type RugItem,
  type StoreyId, type WallId, type WallSide,
} from './restaurant'
import { WALL_ART } from './wall'
import { Cat, Waiter } from './WalkerSprites'
import { blockedTiles, entranceTile, findPath, STEP_MS, useWalkers, type Pt } from './walkers'
import { AvatarFigure } from './AvatarFigure'
import { stepSound } from './audio'
import type { Avatar } from './avatar'
import { along, type V } from './townwalk'

export const floorArt = (t: ItemType) => DECOR[t as FloorItem | RugItem]

/** Furniture is drawn a little smaller than its tile so rooms breathe. Everything that sits on or beside it shrinks to match. */
const S = 0.86

/** Where an item's art is anchored and shrunk (about the middle of its footprint). */
function itemTf(type: ItemType, gx: number, gy: number, flip?: boolean): string {
  const def = itemDef(type)
  const [sx, sy] = P(gx, gy)
  const mirror = flip ? ' scale(-1 1)' : ''
  if (def.layer !== 'floor') return `translate(${sx} ${sy})${mirror}`
  const [cx, cy] = P(def.w / 2, def.d / 2)
  return `translate(${sx} ${sy})${mirror} translate(${cx} ${cy}) scale(${S}) translate(${-cx} ${-cy})`
}

/** A point near an item (tile coordinates and height), pulled in toward its centre like its art. */
function shrinkPt(p: Placed, x: number, y: number, z: number): [number, number, number] {
  const def = itemDef(p.type)
  const cx = p.gx + (p.flip ? def.d : def.w) / 2
  const cy = p.gy + (p.flip ? def.w : def.d) / 2
  return [cx + (x - cx) * S, cy + (y - cy) * S, z * S]
}

const chefPoint = (p: Placed): [number, number] => {
  const [x, y, z] = shrinkPt(p, p.flip ? p.gx + 0.12 : p.gx + 1, p.flip ? p.gy + 1 : p.gy + 0.12, 32)
  return P(x, y, z)
}

/** A diner index past the end of the list means the rare guest. */
const ASH = CUSTOMERS.length

const ASH_LINES = ['The tea here is divine.', 'Tell the chef: marvellous!', 'What a lovely little place.', 'I do adore a lantern.', 'Is that rice I smell? Bliss.', 'Keep shining, dear chef.']

const WALL_H = 124
const SLAB = 14
const THICK = 0.16

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

export function phaseOf(d: Date = new Date()): Phase {
  const h = d.getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

export const SKY: Record<Phase, { stops: [string, string, string]; far: string; ambient: string; ambientA: number; shaft: string; shaftA: number; glow: number }> = {
  dawn: { stops: ['#5b4a9a', '#e58fb0', '#ffd9a0'], far: '#5a4a80', ambient: '#ff9ab0', ambientA: 0.1, shaft: '#ffd6e0', shaftA: 0.3, glow: 0.6 },
  day: { stops: ['#5fb4f0', '#a6dcff', '#fff1c8'], far: '#7d93bd', ambient: '#ffffff', ambientA: 0, shaft: '#fff2b0', shaftA: 0.34, glow: 0.3 },
  dusk: { stops: ['#3a2a86', '#c0508a', '#ffb070'], far: '#3a1f5a', ambient: '#ff8a5a', ambientA: 0.13, shaft: '#ffb070', shaftA: 0.3, glow: 0.85 },
  night: { stops: ['#140c45', '#4b2a8a', '#c0508a'], far: '#1a0e3b', ambient: '#2a1a7a', ambientA: 0.24, shaft: '#bcd0ff', shaftA: 0.2, glow: 1 },
}

const WALL_COLORS: Record<WallId, { left: string; right: string; trim: string; panel: string }> = {
  cream: { left: '#f6e8cf', right: '#e8d5b2', trim: '#b98a55', panel: 'rgba(150,100,50,0.22)' },
  indigo: { left: '#454aa6', right: '#343887', trim: '#241f55', panel: 'rgba(255,255,255,0.12)' },
  matcha: { left: '#a9d083', right: '#8fb86b', trim: '#5e7d3e', panel: 'rgba(40,80,20,0.2)' },
  sakura: { left: '#ffd6e2', right: '#f3b8cb', trim: '#c27a92', panel: 'rgba(160,60,90,0.18)' },
}

/** Shared gradients, filters and glows. Safe to render in several SVGs. */
export function RoomDefs({ phase = 'night' }: { phase?: Phase }) {
  const s = SKY[phase].stops
  return (
    <defs>
      <radialGradient id="glowWarm"><stop offset="0" stopColor="#ffb347" stopOpacity="0.62" /><stop offset="1" stopColor="#ff8a3d" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowPink"><stop offset="0" stopColor="#ff7fc0" stopOpacity="0.55" /><stop offset="1" stopColor="#ff7fc0" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowCyan"><stop offset="0" stopColor="#7fe6ff" stopOpacity="0.6" /><stop offset="1" stopColor="#7fe6ff" stopOpacity="0" /></radialGradient>
      <radialGradient id="glowGold"><stop offset="0" stopColor="#ffd45e" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd45e" stopOpacity="0" /></radialGradient>
      <linearGradient id="water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8fe9ff" /><stop offset="1" stopColor="#3f9fd8" /></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s[0]} /><stop offset="0.6" stopColor={s[1]} /><stop offset="1" stopColor={s[2]} /></linearGradient>
      <linearGradient id="door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe3a0" /><stop offset="1" stopColor="#ff9a5a" /></linearGradient>
      <filter id="neon" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  )
}

/** One catalogue item on its own, for shop cards. */
export function DecorPreview({ type, size = 84 }: { type: ItemType; size?: number }) {
  if (itemDef(type).layer === 'wall') {
    const wa = WALL_ART[type as keyof typeof WALL_ART]
    const [, , w, h] = wa.view.split(' ').map(Number)
    return (
      <svg viewBox={wa.view} width={size * (w / h)} height={size} aria-hidden>
        <RoomDefs />
        <g transform="scale(1 -1)">{wa.draw()}</g>
      </svg>
    )
  }
  const d = floorArt(type)
  const [, , w, h] = d.view.split(' ').map(Number)
  return (
    <svg viewBox={d.view} width={size * (w / h)} height={size} aria-hidden>
      <RoomDefs />
      {d.art()}
    </svg>
  )
}

/** Small deterministic hash for per-tile variation. */
const hash = (a: number, b: number) => {
  let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 3266489917)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function floorTile(floor: FloorId, gx: number, gy: number): ReactNode {
  const pts = [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)].map((p) => p.join(',')).join(' ')
  const alt = (gx + gy) % 2 === 0
  const n = hash(gx, gy)
  const key = `${gx}-${gy}`
  const inset = (k: number) => [P(gx + k, gy + k), P(gx + 1 - k, gy + k), P(gx + 1 - k, gy + 1 - k), P(gx + k, gy + 1 - k)].map((p) => p.join(',')).join(' ')
  const lit = `M${P(gx, gy + 1).join(',')}L${P(gx, gy).join(',')}L${P(gx + 1, gy).join(',')}`
  const shade = `M${P(gx + 1, gy).join(',')}L${P(gx + 1, gy + 1).join(',')}L${P(gx, gy + 1).join(',')}`
  const bevel = (
    <>
      <path d={lit} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinejoin="round" />
      <path d={shade} fill="none" stroke="rgba(30,10,40,0.2)" strokeWidth="1.3" strokeLinejoin="round" />
    </>
  )
  if (floor === 'wood') {
    const base = 232 - Math.round(n * 16)
    const lines = [0.25, 0.5, 0.75]
      .map((v, i) => `M${P(gx, gy + v).join(',')}L${P(gx + 0.3 + hash(gx + i, gy) * 0.4, gy + v).join(',')}M${P(gx + 0.55 + hash(gy, gx + i) * 0.3, gy + v).join(',')}L${P(gx + 1, gy + v).join(',')}`)
      .join('')
    return (
      <g key={key}>
        <polygon points={pts} fill={`rgb(${base},${Math.round(base * 0.82)},${Math.round(base * 0.55)})`} stroke="rgba(80,40,10,0.4)" strokeWidth="1" />
        <path d={lines} stroke="rgba(120,70,25,0.32)" strokeWidth="1" fill="none" />
        {bevel}
      </g>
    )
  }
  if (floor === 'tatami') {
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#bad27c' : '#a9c46a'} stroke="#efe4c2" strokeWidth="2.2" strokeLinejoin="round" />
        <path d={`M${P(gx + 0.5, gy + 0.04).join(',')}L${P(gx + 0.5, gy + 0.96).join(',')}`} stroke="rgba(90,120,40,0.35)" strokeWidth="1" />
        <path d={`M${P(gx + 0.14, gy + 0.2).join(',')}L${P(gx + 0.14, gy + 0.8).join(',')}M${P(gx + 0.86, gy + 0.2).join(',')}L${P(gx + 0.86, gy + 0.8).join(',')}`} stroke="rgba(90,120,40,0.22)" strokeWidth="1" />
        {bevel}
      </g>
    )
  }
  if (floor === 'stone') {
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#8d8ca6' : '#9998b2'} stroke="rgba(30,20,50,0.45)" strokeWidth="1" />
        <polygon points={inset(0.1)} fill={`rgba(255,255,255,${0.04 + n * 0.08})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <circle cx={P(gx + 0.3, gy + 0.6)[0]} cy={P(gx + 0.3, gy + 0.6)[1]} r="1.2" fill="rgba(255,255,255,0.28)" />
        <circle cx={P(gx + 0.7, gy + 0.3)[0]} cy={P(gx + 0.7, gy + 0.3)[1]} r="1" fill="rgba(20,10,40,0.25)" />
        {bevel}
      </g>
    )
  }
  if (floor === 'deck') {
    const base = 150 - Math.round(n * 14)
    const gaps = [0.2, 0.4, 0.6, 0.8].map((v) => `M${P(gx, gy + v).join(',')}L${P(gx + 1, gy + v).join(',')}`).join('')
    return (
      <g key={key}>
        <polygon points={pts} fill={`rgb(${base + 28},${base + 8},${base - 14})`} stroke="rgba(40,24,16,0.45)" strokeWidth="1" />
        <path d={gaps} stroke="rgba(30,18,12,0.5)" strokeWidth="1.4" fill="none" />
        <path d={`M${P(gx + 0.15, gy + 0.1).join(',')}L${P(gx + 0.5 + n * 0.3, gy + 0.1).join(',')}`} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {bevel}
      </g>
    )
  }
  if (floor === 'grass') {
    const blades = [0, 1, 2, 3, 4].map((i) => {
      const bx = gx + 0.1 + hash(gx * 7 + i, gy) * 0.8
      const by = gy + 0.1 + hash(gx, gy * 5 + i) * 0.8
      const [px, py] = P(bx, by)
      return <path key={i} d={`M${px} ${py}l-1.4 -4M${px} ${py}l1.6 -4.4`} stroke="#4a9a3a" strokeWidth="1.2" strokeLinecap="round" />
    })
    return (
      <g key={key}>
        <polygon points={pts} fill={alt ? '#7fcf5a' : '#74c452'} stroke="rgba(30,70,20,0.35)" strokeWidth="1" />
        {blades}
        {n > 0.8 && <circle cx={P(gx + 0.5, gy + 0.5)[0]} cy={P(gx + 0.5, gy + 0.5)[1]} r="1.6" fill="#fff" opacity="0.85" />}
      </g>
    )
  }
  return (
    <g key={key}>
      <polygon points={pts} fill={alt ? '#d9473f' : '#fff0d8'} stroke="rgba(60,20,30,0.35)" strokeWidth="1" />
      <polygon points={inset(0.08)} fill="none" stroke={alt ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.07)'} strokeWidth="1" />
      {bevel}
    </g>
  )
}

function Lantern({ u, v, hue = 0, glow = 1 }: { u: number; v: number; hue?: number; glow?: number }) {
  const c = [['#ff7a45', '#c23a24'], ['#ffd45e', '#d98a00'], ['#ff8fb0', '#c2456f']][hue % 3]
  return (
    <g className="sway" style={{ transformOrigin: `${u}px ${v + 10}px`, animationDelay: `${-u / 40}s` }}>
      <circle cx={u} cy={v - 4} r="17" fill="url(#glowWarm)" opacity={glow} className="flick" />
      <line x1={u} y1={v + 10} x2={u} y2={v + 3} stroke={OL} strokeWidth="1.4" />
      <ellipse cx={u} cy={v - 4} rx="6.4" ry="8" fill={c[0]} stroke={OL} strokeWidth="1.8" />
      <ellipse cx={u - 2} cy={v - 6} rx="1.8" ry="3.4" fill="#fff" opacity="0.55" />
      <rect x={u - 3} y={v - 13} width="6" height="2.4" rx="1" fill={c[1]} stroke={OL} strokeWidth="1" />
    </g>
  )
}

/** Window geometry shared by the wall drawing and the light shaft on the floor (in px along the wall). */
const winGeom = (N: number) => {
  const len = N * 32
  const w = Math.min(132, len - 76)
  return { len, w, u: (len - w) / 2 + 6 }
}

function Walls({ N, wall, phase, glow, shoji = false }: { N: number; wall: WallId; phase: Phase; glow: number; shoji?: boolean }) {
  const col = WALL_COLORS[wall]
  const sky = SKY[phase]
  const { len, w: winW, u: winU } = winGeom(N)
  const [ox, oy] = P(0, 0)
  const lw = (g: ReactNode) => <g transform={`matrix(-1 0.5 0 -1 ${ox} ${oy})`}>{g}</g>
  const rw = (g: ReactNode) => <g transform={`matrix(1 0.5 0 -1 ${ox} ${oy})`}>{g}</g>
  const doorU = len * 0.5 - 22
  const cap = '#8a5b38'
  const capEnd = '#5f3a24'

  const interior = (fill: string) => (
    <>
      <rect x={0} y={0} width={len} height={WALL_H} fill={fill} />
      {Array.from({ length: Math.floor(len / 32) + 1 }, (_, i) => <line key={i} x1={i * 32} y1={30} x2={i * 32} y2={WALL_H - 8} stroke={col.panel} strokeWidth="1.4" />)}
      <line x1="0" y1="52" x2={len} y2="52" stroke={col.panel} strokeWidth="1.4" />
      <rect x={0} y={0} width={len} height={30} fill={col.trim} opacity="0.85" />
      {Array.from({ length: Math.floor(len / 32) }, (_, i) => <rect key={i} x={i * 32 + 4} y={5} width={24} height={20} rx="2" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />)}
      <line x1="0" y1="30" x2={len} y2="30" stroke={OL} strokeWidth="2" />
      <rect x={0} y={0} width={len} height={6} fill="#2e1c14" opacity="0.55" />
      <rect x={0} y={WALL_H - 8} width={len} height={8} fill="#4b2f20" stroke={OL} strokeWidth="2" />
      <line x1="0" y1={WALL_H - 9} x2={len} y2={WALL_H - 9} stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
      <rect x={0} y={0} width={len} height={WALL_H} fill="url(#wallShade)" />
    </>
  )

  return (
    <g>
      <defs>
        <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <Box x={-THICK} y={0} w={THICK} d={N} h={WALL_H} c={[cap, capEnd, col.left]} />
      <Box x={0} y={-THICK} w={N} d={THICK} h={WALL_H} c={[cap, col.right, capEnd]} />
      <Box x={-THICK} y={-THICK} w={THICK} d={THICK} h={WALL_H + 5} c={['#a46a40', '#5f3a24', '#4a2c1a']} />
      {lw(
        <>
          {interior(col.left)}
          <g>
            <rect x={winU} y={50} width={winW} height={60} fill="url(#sky)" stroke="#5a3a22" strokeWidth="5" strokeLinejoin="round" />
            {phase === 'night' && [0.12, 0.3, 0.5, 0.88, 0.42, 0.62].map((f, i) => <circle key={i} cx={winU + winW * f} cy={98 + ((i * 5) % 9)} r="1.2" fill="#fff" opacity="0.85" className="twinkle" style={{ animationDelay: `${-i * 0.6}s` }} />)}
            {phase === 'night' ? (
              <>
                <circle cx={winU + winW * 0.72} cy={92} r="12" fill="#fff3c4" opacity="0.35" />
                <circle cx={winU + winW * 0.72} cy={92} r="8" fill="#fff8e0" />
              </>
            ) : (
              <>
                <circle cx={winU + winW * (phase === 'day' ? 0.72 : 0.3)} cy={phase === 'day' ? 96 : 66} r="14" fill="#fff2b0" opacity="0.4" />
                <circle cx={winU + winW * (phase === 'day' ? 0.72 : 0.3)} cy={phase === 'day' ? 96 : 66} r="8" fill={phase === 'day' ? '#fff6c0' : '#ffb070'} />
              </>
            )}
            <path d={`M${winU + 2} 56V62h14V70h10V60h10v8h12V64h12V74h14V62h10v10h10V66h8V56Z`} fill={sky.far} opacity="0.95" />
            {[14, 38, 62, 88, 108].map((x, i) => (
              <rect key={i} x={winU + x} y={56 + (i % 3) * 3} width="3" height="3.5" fill="#ffcf6b" opacity={phase === 'day' ? 0.2 : 1} className="flick" style={{ animationDelay: `${-i}s` }} />
            ))}
            <line x1={winU + winW / 3} y1="50" x2={winU + winW / 3} y2="110" stroke="#5a3a22" strokeWidth="3" />
            <line x1={winU + (winW * 2) / 3} y1="50" x2={winU + (winW * 2) / 3} y2="110" stroke="#5a3a22" strokeWidth="3" />
            <line x1={winU} y1="80" x2={winU + winW} y2="80" stroke="#5a3a22" strokeWidth="3" />
            <rect x={winU} y={50} width={winW} height={60} fill="url(#glassShine)" pointerEvents="none" />
            <rect x={winU - 4} y={46} width={winW + 8} height="5" fill="#7a4e30" stroke={OL} strokeWidth="1.8" />
            <rect x={winU - 5} y={108} width={winW + 10} height="6" fill="#7a4e30" stroke={OL} strokeWidth="1.8" />
          </g>
          <path d={`M4 ${WALL_H - 14}Q${len / 2} ${WALL_H - 30} ${len - 4} ${WALL_H - 14}`} fill="none" stroke="rgba(42,15,46,0.7)" strokeWidth="1.4" />
          {[len * 0.18, len * 0.5, len * 0.82].map((u, i) => (
            <Lantern key={i} u={u} v={WALL_H - 28 + (i === 1 ? 4 : 0)} hue={i} glow={glow} />
          ))}
        </>,
      )}
      {rw(
        <>
          {interior(col.right)}
          <rect x={doorU - 2} y={0} width={48} height={92} fill="url(#door)" stroke={OL} strokeWidth="3" />
          <rect x={doorU - 4} y={0} width={52} height={92} fill="none" stroke="#5a3a22" strokeWidth="5" />
          <rect x={doorU - 7} y={88} width={58} height={7} fill="#7a4e30" stroke={OL} strokeWidth="1.8" />
          {shoji ? (
            <g>
              <rect x={doorU} y={2} width={44} height={86} fill="#fff4d8" stroke={OL} strokeWidth="1.6" />
              {[0, 1].map((c) => [0, 1, 2, 3, 4].map((rw) => <rect key={`${c}${rw}`} x={doorU + 2 + c * 21} y={4 + rw * 16.6} width="19" height="15" fill="rgba(255,236,190,0.7)" stroke="#8a5a3a" strokeWidth="1.2" />))}
              <line x1={doorU + 22} y1="2" x2={doorU + 22} y2="88" stroke="#5a3a22" strokeWidth="2.2" />
              <rect x={doorU + 19} y="40" width="3" height="10" rx="1" fill="#4b2f20" /><rect x={doorU + 23} y="40" width="3" height="10" rx="1" fill="#4b2f20" />
            </g>
          ) : (
            <>
              {[0, 1, 2].map((i) => (
                <g key={i} className="sway" style={{ transformOrigin: `${doorU + 7 + i * 15}px 86px`, animationDelay: `${-i * 0.5}s` }}>
                  <rect x={doorU + i * 15 + 1} y={46} width="13" height="40" rx="1.5" fill="#2c3a8f" stroke={OL} strokeWidth="1.8" />
                  <circle cx={doorU + i * 15 + 7.5} cy={64} r="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
                </g>
              ))}
              <rect x={doorU - 2} y={84} width={48} height="4" fill="#4b2f20" stroke={OL} strokeWidth="1.4" />
            </>
          )}
          <path d={`M4 ${WALL_H - 14}Q${len / 2} ${WALL_H - 30} ${len - 4} ${WALL_H - 14}`} fill="none" stroke="rgba(42,15,46,0.7)" strokeWidth="1.4" />
          {[len * 0.16, len * 0.84].map((u, i) => (
            <Lantern key={i} u={u} v={WALL_H - 28} hue={i + 1} glow={glow} />
          ))}
        </>,
      )}
    </g>
  )
}

/** The rooftop's low railing, corner poles and warm string lights. */
function Railing({ N, glow }: { N: number; glow: number }) {
  const tri: [string, string, string] = ['#6b5586', '#4b3a63', '#33264a']
  const rail: [string, string, string] = ['#d8dcec', '#aab2c8', '#8890aa']
  const posts: ReactNode[] = []
  for (let i = 0; i <= N; i++) {
    posts.push(<Box key={`x${i}`} x={i - 0.035} y={-0.07} w={0.07} d={0.07} h={26} c={tri} sw={1.6} />)
    posts.push(<Box key={`y${i}`} x={-0.07} y={i - 0.035} w={0.07} d={0.07} h={26} c={tri} sw={1.6} />)
  }
  const mid = Math.round(N / 2)
  const spans: { a: [number, number]; b: [number, number] }[] = [
    { a: [0, -0.04], b: [mid, -0.04] }, { a: [mid, -0.04], b: [N, -0.04] },
    { a: [-0.04, 0], b: [-0.04, mid] }, { a: [-0.04, mid], b: [-0.04, N] },
  ]
  const poles: [number, number][] = [[0, -0.04], [mid, -0.04], [N, -0.04], [-0.04, mid], [-0.04, N]]
  return (
    <g>
      <Box x={0} y={-0.07} w={N} d={0.05} h={3} z={26} c={rail} sw={1.8} />
      <Box x={-0.07} y={0} w={0.05} d={N} h={3} z={26} c={rail} sw={1.8} />
      <Box x={0} y={-0.07} w={N} d={0.04} h={2} z={13} c={rail} sw={1.4} />
      <Box x={-0.07} y={0} w={0.04} d={N} h={2} z={13} c={rail} sw={1.4} />
      {posts}
      {poles.map(([x, y], i) => <Box key={`p${i}`} x={x - 0.04} y={y - 0.04} w={0.08} d={0.08} h={64} c={tri} sw={1.8} />)}
      {spans.map((s, i) => {
        const [x0, y0] = P(s.a[0], s.a[1], 62)
        const [x1, y1] = P(s.b[0], s.b[1], 62)
        const mx = (x0 + x1) / 2
        const my = (y0 + y1) / 2 + 14
        const bulbs = Array.from({ length: 6 }, (_, k) => {
          const t = (k + 1) / 7
          const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1
          const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1
          return { bx, by, k }
        })
        return (
          <g key={i}>
            <path d={`M${x0} ${y0}Q${mx} ${my} ${x1} ${y1}`} fill="none" stroke="rgba(42,15,46,0.85)" strokeWidth="1.4" />
            {bulbs.map((b) => (
              <g key={b.k}>
                <circle cx={b.bx} cy={b.by + 3} r="9" fill="url(#glowWarm)" opacity={glow} className="flick" style={{ animationDelay: `${-(b.k + i) * 0.7}s` }} />
                <circle cx={b.bx} cy={b.by + 3} r="2.6" fill="#ffe9a0" stroke={OL} strokeWidth="1" />
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
}

export interface Ghost {
  type: ItemType
  gx: number
  gy: number
  ignoreId?: number
  flip?: boolean
}

export interface RoomProps {
  r: Restaurant
  grid: number
  /** Show the tile grid and block item taps (placing mode). */
  placing?: Ghost | null
  /** Placing a wall item: free wall slots light up and can be tapped. */
  wallGhost?: { type: ItemType; side: WallSide; slot: number; ignoreId?: number } | null
  onWall?: (side: WallSide, slot: number) => void
  selectedId?: number | null
  onTile?: (gx: number, gy: number) => void
  onItem?: (id: number) => void
  /** Pointer hover over a tile (mouse only). */
  onHover?: (gx: number, gy: number) => void
  /** Which storey is shown: the rooftop is open air with a railing instead of walls. */
  storey?: StoreyId
  /** Force a time of day (stills); otherwise the player's clock decides. */
  phase?: Phase
  /** Let diners come and go. Off for stills. */
  live?: boolean
  /** The player's character: tap the floor to walk around. */
  avatar?: Avatar
  /** A speech-bubble emote over the avatar; change `n` to show another. */
  emote?: { n: number; e: string }
  /** A special guest sat down. */
  onGuest?: (id: string) => void
}

type Seat = ReturnType<typeof seats>[number]

/** Where a diner sits, in grid coordinates, honouring rotation. */
function seatSpot(r: Restaurant, s: Seat): { x: number; y: number; z: number; key: number } {
  const it = r.items.find((p) => p.id === s.itemId)!
  const def = itemDef(it.type)
  const fw = it.flip ? def.d : def.w
  const fd = it.flip ? def.w : def.d
  let lx = 0.5
  let ly = 0.5
  let z = 24
  let adj = 0.4
  if (it.type === 'table' || it.type === 'kotatsu') {
    lx = s.slot === 0 ? 0.06 : 0.94
    z = it.type === 'kotatsu' ? 12 : 14
    adj = s.slot === 0 ? -0.8 : 0.4
  } else if (it.type === 'counter') {
    lx = 0.5 + s.slot
    ly = 1.18
    z = 18
  } else if (it.type === 'bench') {
    lx = 0.5 + s.slot
    z = 20
  } else if (it.type === 'booth') {
    lx = 0.38 + s.slot * 0.62
    ly = 0.42
    z = 20
  }
  if (it.flip) [lx, ly] = [ly, lx]
  const [sx, sy, sz] = shrinkPt(it, it.gx + lx, it.gy + ly, z)
  return { x: sx, y: sy, z: sz, key: it.gx + it.gy + fw + fd + adj }
}

export default function Room({ r, grid, placing, wallGhost, onWall, selectedId, onTile, onItem, onHover, storey = 'ground', phase: forced, live = true, avatar, emote, onGuest }: RoomProps) {
  const guestRef = useRef(onGuest)
  guestRef.current = onGuest
  const [bubble, setBubble] = useState<string | null>(null)
  useEffect(() => {
    if (!emote?.n) return
    setBubble(emote.e)
    const id = setTimeout(() => setBubble(null), 2200)
    return () => clearTimeout(id)
  }, [emote?.n])
  const rooftop = storey === 'rooftop'
  const topH = rooftop ? 78 : WALL_H
  const svg = useRef<SVGSVGElement>(null)
  const [phase, setPhase] = useState<Phase>(() => forced ?? phaseOf())
  useEffect(() => {
    if (forced) return setPhase(forced)
    const id = setInterval(() => setPhase(phaseOf()), 60_000)
    return () => clearInterval(id)
  }, [forced])
  const sky = SKY[phase]
  const blockedNow = blockedTiles(r)
  const door = entranceTile(blockedNow, grid)
  const [me, setMe] = useState<{ x: number; y: number; left: boolean; walking: boolean } | null>(null)
  const meRef = useRef(me)
  meRef.current = me
  const trip = useRef<{ route: V[]; walked: number } | null>(null)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  // Start at the door, and step back to it if furniture lands on our feet.
  useEffect(() => {
    if (!avatar || !door) return
    const cur = meRef.current
    const stuck = cur && blockedNow.has(`${Math.floor(cur.x)},${Math.floor(cur.y)}`)
    if (!cur || stuck) {
      cancelAnimationFrame(raf.current)
      trip.current = null
      setMe({ x: door[0] + 0.5, y: door[1] + 0.5, left: false, walking: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar, r, grid])

  const walkToTile = (gx: number, gy: number) => {
    const cur = meRef.current
    if (!avatar || !cur) return
    let dest: Pt = [gx, gy]
    if (blockedNow.has(`${gx},${gy}`)) {
      // Tapped furniture: go to the nearest free tile beside it.
      const near = ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as Pt[])
        .map(([dx, dy]) => [gx + dx, gy + dy] as Pt)
        .filter(([x, y]) => x >= 0 && y >= 0 && x < grid && y < grid && !blockedNow.has(`${x},${y}`))
      if (!near.length) return
      near.sort((a, b) => Math.hypot(a[0] + 0.5 - cur.x, a[1] + 0.5 - cur.y) - Math.hypot(b[0] + 0.5 - cur.x, b[1] + 0.5 - cur.y))
      dest = near[0]
    }
    const from: Pt = [Math.min(grid - 1, Math.max(0, Math.floor(cur.x))), Math.min(grid - 1, Math.max(0, Math.floor(cur.y)))]
    const tiles = findPath(blockedNow, grid, from, dest)
    if (!tiles || !tiles.length) return
    const route: V[] = [[cur.x, cur.y], ...tiles.map(([x, y]) => [x + 0.5, y + 0.5] as V)]
    cancelAnimationFrame(raf.current)
    trip.current = { route, walked: 0 }
    let last = performance.now()
    let stepped = 0
    const step = (now: number) => {
      const tr = trip.current
      if (!tr) return
      tr.walked += 3 * Math.min(0.05, (now - last) / 1000)
      last = now
      const a = along(tr.route, tr.walked)
      if (tr.walked - stepped >= 0.6) {
        stepped = tr.walked
        stepSound()
      }
      setMe({ x: a.pos[0], y: a.pos[1], left: a.dx - a.dy < 0, walking: !a.done })
      if (a.done) {
        trip.current = null
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  const walkers = useWalkers(r, grid, live && true)

  const minX = -grid * 32 - 14
  const width = grid * 64 + 28
  const minY = -topH - 26
  const height = topH + grid * 32 + SLAB + 56

  // ---- diners come and go, leaving tips behind ----
  const seatList = seats(r).filter((s) => r.items.some((p) => p.id === s.itemId))
  const seatKey = (s: Seat) => `${s.itemId}-${s.slot}`
  const seatIds = seatList.map(seatKey).join('|')
  const diners = useRef<Record<string, number | null>>({})
  const [, rerender] = useReducer((x: number) => x + 1, 0)
  const [chat, setChat] = useState<{ key: string; line: string } | null>(null)
  const chatTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(chatTimer.current), [])
  const [coins, setCoins] = useState<{ id: number; x: number; y: number }[]>([])
  const coinId = useRef(0)
  const rRef = useRef(r)
  rRef.current = r

  seatList.forEach((s, i) => {
    const k = seatKey(s)
    // Dev switch (/?ash): the rare guest is already seated, for checking how she looks.
    if (!(k in diners.current)) diners.current[k] = i === 1 && new URLSearchParams(location.search).has('ash') ? ASH : i < 8 ? i % CUSTOMERS.length : null
  })

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      const cur = rRef.current
      const list = seats(cur).filter((s) => cur.items.some((p) => p.id === s.itemId))
      let changed = false
      let occupied = list.filter((s) => diners.current[seatKey(s)] != null).length
      for (const s of list) {
        const k = seatKey(s)
        const who = diners.current[k]
        if (who != null && occupied > 1 && Math.random() < 0.08) {
          diners.current[k] = null
          occupied--
          changed = true
          const spot = seatSpot(cur, s)
          const [px, py] = P(spot.x, spot.y, spot.z + 30)
          // Ashlyndia tips like royalty: a little shower of coins.
          const burst = who === ASH ? [-16, 0, 16] : [0]
          for (const dx of burst) {
            const cid = ++coinId.current
            setCoins((c) => [...c, { id: cid, x: px + dx, y: py - Math.abs(dx) * 0.4 }])
            setTimeout(() => setCoins((c) => c.filter((x) => x.id !== cid)), 2000)
          }
        } else if (who == null && occupied < 10 && Math.random() < 0.22) {
          const here = Object.values(diners.current).includes(ASH)
          const special = !here && Math.random() < 0.08
          diners.current[k] = special ? ASH : Math.floor(Math.random() * CUSTOMERS.length)
          if (special) guestRef.current?.('ashlyndia')
          occupied++
          changed = true
        }
      }
      if (changed) rerender()
    }, 2400)
    return () => clearInterval(id)
  }, [live, seatIds])

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
  const floorItems = r.items.filter((p) => itemDef(p.type).layer === 'floor')
  const rugs = r.items.filter((p) => itemDef(p.type).layer === 'rug')
  const wallItems = r.items.filter((p) => itemDef(p.type).layer === 'wall')
  floorItems.forEach((p) => {
    const def = itemDef(p.type)
    const base = p.gx + p.gy + def.w + def.d
    drawables.push({
      key: base,
      node: (
        <g
          key={`i${p.id}`}
          transform={itemTf(p.type, p.gx, p.gy, p.flip)}
          style={{ cursor: !placing && onItem ? 'pointer' : undefined, pointerEvents: placing ? 'none' : 'auto' }}
          onPointerUp={(e) => {
            if (placing || !onItem) return
            e.stopPropagation()
            onItem(p.id)
          }}
        >
          {floorArt(p.type).art()}
        </g>
      ),
    })
    if (p.type === 'counter') {
      // The chef works behind the counter.
      const [cx, cy] = chefPoint(p)
      drawables.push({
        key: base - 0.3,
        node: (
          <g key={`chef${p.id}`} transform={`translate(${cx - 22} ${cy - 40})`} pointerEvents="none">
            <g className="chef">
              <Mascot mood="cheer" size={44} />
              <path className="steam" d="M30 10q-3 -4 0 -8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
            </g>
          </g>
        ),
      })
    }
  })
  seatList.forEach((s) => {
    const k = seatKey(s)
    const who = diners.current[k]
    if (who == null) return
    const spot = seatSpot(r, s)
    const [px, py] = P(spot.x, spot.y, spot.z)
    drawables.push({
      key: spot.key,
      node: (
        <g
          key={`c${k}-${who}`}
          transform={`translate(${px - 21} ${py - 40})`}
          pointerEvents={who === ASH ? 'auto' : 'none'}
          style={who === ASH ? { cursor: 'pointer' } : undefined}
          onPointerUp={who === ASH ? (e) => {
            // Chatting with the rare guest, not walking: keep the tap to ourselves.
            e.stopPropagation()
            const pool = ASH_LINES
            const line = pool[(Math.floor(Math.random() * pool.length) + (chat ? 1 : 0)) % pool.length]
            setChat({ key: k, line })
            clearTimeout(chatTimer.current)
            chatTimer.current = setTimeout(() => setChat(null), 3600)
          } : undefined}
        >
          <g className="arrive">
            <ellipse cx="21" cy="42" rx="15" ry="5" fill="rgba(18,4,36,0.3)" />
            {who === ASH && chat?.key === k && (
              <g transform="translate(21 -6)">
                <g className="emote">
                  <rect x="-58" y="-22" width="116" height="26" rx="9" fill="#fffdf7" stroke="#2a0f2e" strokeWidth="1.6" />
                  <path d="M-5 4l5 7 5-7z" fill="#fffdf7" stroke="#2a0f2e" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M-4 3.4h8" stroke="#fffdf7" strokeWidth="2.4" />
                  <text y="-5" textAnchor="middle" fontSize="7.4" fontWeight="800" fill="#2a0f2e" fontFamily="'M PLUS Rounded 1c', sans-serif">{chat.line}</text>
                </g>
              </g>
            )}
            {who === ASH && (
              <g className="ashaura" aria-hidden>
                <path d="M-2 8l1.6 3.6 3.6 1.6-3.6 1.6L-2 18.4l-1.6-3.6L-7.2 13.2l3.6-1.6z" fill="#ffe27a" stroke="#2a0f2e" strokeWidth="0.8" className="twinkle" />
                <path d="M44 2l1.4 3 3 1.4-3 1.4L44 10.8l-1.4-3-3-1.4 3-1.4z" fill="#fff" stroke="#2a0f2e" strokeWidth="0.8" className="twinkle" style={{ animationDelay: '-0.8s' }} />
                <ellipse cx="21" cy="42" rx="22" ry="7" fill="#d29bff" opacity="0.45" />
              </g>
            )}
            <CustomerPortrait customer={who === ASH ? ASHLYNDIA : CUSTOMERS[who]} mood="happy" size={42} />
            <path className="steam" style={{ animationDelay: `${-who * 0.7}s` }} d="M30 6q-3 -4 0 -8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          </g>
        </g>
      ),
    })
  })
  drawables.sort((a, b) => a.key - b.key)

  const diamond = (gx: number, gy: number, w = 1, d = 1) =>
    [P(gx, gy), P(gx + w, gy), P(gx + w, gy + d), P(gx, gy + d)].map((p) => p.join(',')).join(' ')
  const poly = (...pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')

  const selected = selectedId ? r.items.find((p) => p.id === selectedId) : null
  const ghostOk = placing ? canPlace(r, placing.type, placing.gx, placing.gy, grid, placing.ignoreId, placing.flip) : false

  // window light shaft across the floor, and warm spill from the street door
  const { u: winU, w: winW, len } = winGeom(grid)
  const y0 = winU / 32
  const y1 = (winU + winW) / 32
  const L = Math.min(grid - 0.4, 3.4)
  const slant = Math.min(1.2, grid - y1 - 0.2)
  const shaft = poly(P(0, y0), P(0, y1), P(L, y1 + slant), P(L, y0 + slant))
  const dx0 = (len * 0.5 - 22) / 32
  const dx1 = dx0 + 44 / 32
  const spill = poly(P(dx0, 0), P(dx1, 0), P(dx1 + 0.25, 1.7), P(dx0 - 0.25, 1.7))
  const motes = Array.from({ length: 8 }, (_, i) => {
    const t = hash(i, 7)
    const u = hash(i, 11)
    return P(0.3 + t * (L - 0.5), y0 + u * (y1 - y0) + t * slant, 4 + hash(i, 3) * 26)
  })
  const roomOutline = poly(P(0, 0, topH), P(grid, 0, topH), P(grid, 0, 0), P(grid, grid, 0), P(grid, grid, -SLAB), P(0, grid, -SLAB), P(0, grid, 0), P(0, grid, topH))
  const floorOutline = poly(P(0, 0), P(grid, 0), P(grid, grid), P(0, grid))
  const [wx0, wy0] = P(grid / 2, 0)
  const [wx1, wy1] = P(grid / 2, 0.8)
  const [lx0, ly0] = P(0, grid / 2)
  const [lx1, ly1] = P(0.8, grid / 2)

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
        else if (t && avatar && !placing && !wallGhost) walkToTile(t[0], t[1])
      }}
      onPointerDown={(e) => {
        // Touching a tile while placing puts the ghost there straight away, so a drag can follow.
        if (!placing || !onHover) return
        const t = tileAt(e)
        if (t) onHover(t[0], t[1])
      }}
      onPointerMove={(e) => {
        if (!onHover) return
        // A mouse hovers; a finger or pen only counts while it is pressed (dragging the item).
        if (e.pointerType !== 'mouse' && !(e.buttons & 1)) return
        if (!placing) return
        const t = tileAt(e)
        if (t) onHover(t[0], t[1])
      }}
    >
      <RoomDefs phase={phase} />
      <defs>
        <clipPath id="roomClip"><polygon points={roomOutline} /></clipPath>
        <clipPath id="floorClip"><polygon points={floorOutline} /></clipPath>
        <linearGradient id="aoR" gradientUnits="userSpaceOnUse" x1={wx0} y1={wy0} x2={wx1} y2={wy1}><stop offset="0" stopColor="#12042a" stopOpacity="0.42" /><stop offset="1" stopColor="#12042a" stopOpacity="0" /></linearGradient>
        <linearGradient id="aoL" gradientUnits="userSpaceOnUse" x1={lx0} y1={ly0} x2={lx1} y2={ly1}><stop offset="0" stopColor="#12042a" stopOpacity="0.42" /><stop offset="1" stopColor="#12042a" stopOpacity="0" /></linearGradient>
        <linearGradient id="shaftG" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stopColor={sky.shaft} stopOpacity={sky.shaftA} /><stop offset="1" stopColor={sky.shaft} stopOpacity="0" /></linearGradient>
        <linearGradient id="spillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb870" stopOpacity="0.4" /><stop offset="1" stopColor="#ffb870" stopOpacity="0" /></linearGradient>
        <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.35" stopColor="#fff" stopOpacity="0" /><stop offset="0.7" stopColor="#fff" stopOpacity="0.1" /></linearGradient>
        <linearGradient id="floorSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.14" /><stop offset="0.6" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      {rooftop ? <Railing N={grid} glow={sky.glow} /> : <Walls N={grid} wall={r.wall} phase={phase} glow={sky.glow} shoji={storey === 'upstairs'} />}
      {/* wall decor hangs on the wall slots */}
      {(rooftop ? [] : (['L', 'R'] as WallSide[])).map((side) => {
        const [ox, oy] = P(0, 0)
        const matrix = side === 'L' ? `matrix(-1 0.5 0 -1 ${ox} ${oy})` : `matrix(1 0.5 0 -1 ${ox} ${oy})`
        const mirror = side === 'L' ? ' scale(-1 1)' : ''
        const taken = new Set(wallItems.filter((p) => p.wall === side && p.id !== wallGhost?.ignoreId).map((p) => p.gx))
        const fixed = fixedSlots(side, grid)
        return (
          <g key={side} transform={matrix}>
            {wallItems
              .filter((p) => p.wall === side)
              .map((p) => (
                <g
                  key={p.id}
                  transform={`translate(${(p.gx + 0.5) * 32} 0)${mirror}`}
                  style={{ cursor: !wallGhost && !placing && onItem ? 'pointer' : undefined, pointerEvents: wallGhost || placing ? 'none' : 'auto' }}
                  onPointerUp={(e) => {
                    if (wallGhost || placing || !onItem) return
                    e.stopPropagation()
                    onItem(p.id)
                  }}
                >
                  {WALL_ART[p.type as keyof typeof WALL_ART].draw()}
                </g>
              ))}
            {selectedId && wallItems.some((p) => p.id === selectedId && p.wall === side) && (
              <rect className="selpulse" pointerEvents="none" x={(wallItems.find((p) => p.id === selectedId)!.gx) * 32 + 1} y={42} width="30" height="70" rx="3" fill="rgba(255,210,58,0.22)" stroke="#ffd23a" strokeWidth="2.4" />
            )}
            {wallGhost &&
              Array.from({ length: grid }, (_, slot) => {
                if (fixed.has(slot)) return null
                const ok = canPlaceWall(r, wallGhost.type, side, slot, grid, wallGhost.ignoreId)
                const here = wallGhost.side === side && wallGhost.slot === slot
                return (
                  <g
                    key={slot}
                    onPointerUp={(e) => {
                      e.stopPropagation()
                      onWall?.(side, slot)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect x={slot * 32 + 1} y={40} width="30" height="74" rx="3" fill={here ? (ok ? 'rgba(109,255,192,0.4)' : 'rgba(255,91,110,0.4)') : ok ? 'rgba(255,255,255,0.1)' : taken.has(slot) ? 'rgba(255,91,110,0.12)' : 'transparent'} stroke={here ? (ok ? '#6dffc0' : '#ff5b6e') : 'rgba(255,255,255,0.4)'} strokeWidth={here ? 2.4 : 1} strokeDasharray={here ? undefined : '3 3'} />
                    {here && (
                      <g transform={`translate(${(slot + 0.5) * 32} 0)${mirror}`} opacity={ok ? 0.85 : 0.45} pointerEvents="none">
                        {WALL_ART[wallGhost.type as keyof typeof WALL_ART].draw()}
                      </g>
                    )}
                  </g>
                )
              })}
          </g>
        )
      })}
      {/* floor slab and tiles */}
      <polygon points={poly(P(0, grid), P(grid, grid), P(grid, grid, -SLAB), P(0, grid, -SLAB))} fill="#7a4e30" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points={poly(P(grid, 0), P(grid, grid), P(grid, grid, -SLAB), P(grid, 0, -SLAB))} fill="#5f3a24" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={`M${P(0, grid, -4).join(',')}L${P(grid, grid, -4).join(',')}L${P(grid, 0, -4).join(',')}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
      <g>{Array.from({ length: grid * grid }, (_, i) => floorTile(r.floor, Math.floor(i / grid), i % grid))}</g>
      {/* rugs lie on the floor, under furniture */}
      <g>
        {rugs.map((p) => (
          <g
            key={p.id}
            transform={`translate(${P(p.gx, p.gy)[0]} ${P(p.gx, p.gy)[1]})${p.flip ? ' scale(-1 1)' : ''}`}
            style={{ cursor: !placing && !wallGhost && onItem ? 'pointer' : undefined, pointerEvents: placing || wallGhost ? 'none' : 'auto' }}
            onPointerUp={(e) => {
              if (placing || wallGhost || !onItem) return
              e.stopPropagation()
              onItem(p.id)
            }}
          >
            {floorArt(p.type).art()}
          </g>
        ))}
      </g>
      {!rooftop && (() => {
        const dt = entranceTile(new Set(), grid)
        if (!dt) return null
        const [dx, dy] = dt
        return (
          <g pointerEvents="none">
            <polygon points={diamond(dx + 0.14, dy + 0.1, 0.72, 0.8)} fill="#7a3a2e" stroke="#2a0f2e" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points={diamond(dx + 0.24, dy + 0.2, 0.52, 0.6)} fill="none" stroke="#e8b878" strokeWidth="1.1" strokeLinejoin="round" />
          </g>
        )
      })()}
      <polygon points={floorOutline} fill="url(#floorSheen)" pointerEvents="none" />
      <polygon points={floorOutline} fill="none" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      {/* soft shadows where walls meet the floor, moonlight and street glow */}
      <g pointerEvents="none" clipPath="url(#floorClip)">
        {!rooftop && <polygon points={poly(P(0, 0), P(grid, 0), P(grid, 0.8), P(0, 0.8))} fill="url(#aoR)" />}
        {!rooftop && <polygon points={poly(P(0, 0), P(0, grid), P(0.8, grid), P(0.8, 0))} fill="url(#aoL)" />}
        <g style={{ mixBlendMode: 'screen' }} display={rooftop ? 'none' : undefined}>
          <polygon points={shaft} fill="url(#shaftG)" />
          {[1 / 3, 2 / 3].map((f) => {
            const yy = y0 + (y1 - y0) * f
            return <polygon key={f} points={poly(P(0, yy - 0.03), P(0, yy + 0.03), P(L, yy + 0.03 + slant), P(L, yy - 0.03 + slant))} fill="rgba(20,8,50,0.35)" style={{ mixBlendMode: 'normal' }} />
          })}
          <polygon points={spill} fill="url(#spillG)" />
        </g>
        {live && motes.map(([mx, my], i) => <circle key={i} className="mote" style={{ animationDelay: `${-i * 1.3}s` }} cx={mx} cy={my} r="1.4" fill="#fff" opacity="0.7" />)}
      </g>
      {/* soft contact shadows ground the furniture */}
      <g pointerEvents="none">
        {floorItems.map((p) => {
          const def = itemDef(p.type)
          const w = p.flip ? def.d : def.w
          const d = p.flip ? def.w : def.d
          const m = (1 - S) / 2 + 0.03
          return <polygon key={`sh${p.id}`} points={diamond(p.gx + m * w, p.gy + m * d, w * (1 - m * 2) + 0.12, d * (1 - m * 2) + 0.12)} fill="rgba(18,4,36,0.3)" />
        })}
      </g>
      {/* light pools */}
      <g style={{ mixBlendMode: 'screen' }} pointerEvents="none" opacity={Math.max(0.35, sky.glow)}>
        {floorItems.map((p) => {
          const g = floorArt(p.type).glow
          return g ? (
            <g key={p.id} transform={itemTf(p.type, p.gx, p.gy, p.flip)}>
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
      {selected && itemDef(selected.type).layer !== 'wall' && (
        <polygon
          className="selpulse"
          pointerEvents="none"
          points={diamond(selected.gx, selected.gy, selected.flip ? itemDef(selected.type).d : itemDef(selected.type).w, selected.flip ? itemDef(selected.type).w : itemDef(selected.type).d)}
          fill="rgba(255,210,58,0.28)"
          stroke="#ffd23a"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {placing &&
        footprint(placing.type, placing.gx, placing.gy, placing.flip).map(([x, y]) => (
          <polygon key={`${x}${y}`} pointerEvents="none" points={diamond(x, y)} fill={ghostOk ? 'rgba(109,255,192,0.4)' : 'rgba(255,91,110,0.4)'} stroke={ghostOk ? '#6dffc0' : '#ff5b6e'} strokeWidth="2.4" strokeLinejoin="round" />
        ))}
      {drawables.map((d) => d.node)}
      {/* staff and pets, with furniture in front of them drawn over the top again */}
      {walkers.map((w) => {
        const [px, py] = P(w.x + 0.5, w.y + 0.5)
        const front = floorItems.filter((p) => {
          const def = itemDef(p.type)
          return p.gx + p.gy + def.w + def.d > w.x + w.y + 1.6 && Math.abs(p.gx + def.w / 2 - (w.x + 0.5)) < 2.6 && Math.abs(p.gy + def.d / 2 - (w.y + 0.5)) < 2.6
        })
        return (
          <g key={w.id} pointerEvents="none">
            <g style={{ transform: `translate(${px}px, ${py}px)`, transition: `transform ${STEP_MS}ms linear` }}>
              {w.id === 'waiter' ? <Waiter left={w.left} walking={w.mode === 'walk'} carrying={w.carrying} /> : <Cat left={w.left} walking={w.mode === 'walk'} />}
            </g>
            {front.map((p) => (
              <g key={`${w.id}-${p.id}`} transform={itemTf(p.type, p.gx, p.gy, p.flip)}>{floorArt(p.type).art()}</g>
            ))}
          </g>
        )
      })}
      {avatar && me && (() => {
        const [px, py] = P(me.x, me.y)
        const front = floorItems.filter((p) => {
          const def = itemDef(p.type)
          return p.gx + p.gy + def.w + def.d > me.x + me.y + 1.1 && Math.abs(p.gx + def.w / 2 - me.x) < 2.6 && Math.abs(p.gy + def.d / 2 - me.y) < 2.6
        })
        return (
          <g pointerEvents="none">
            <g transform={`translate(${px} ${py}) scale(0.74)`}><AvatarFigure a={avatar} left={me.left} walking={me.walking} /></g>
            {bubble && (
              <g transform={`translate(${px} ${py - 52})`}><g className="emote">
                <path d="M-14 -12h28a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-10l-4 6-4-6h-10a6 6 0 0 1-6-6v-10a6 6 0 0 1 6-6z" fill="#fffdf7" stroke="#2a0f2e" strokeWidth="1.6" strokeLinejoin="round" />
                <text y="4" textAnchor="middle" fontSize="15">{bubble}</text>
              </g></g>
            )}
            {front.map((p) => (
              <g key={`me-${p.id}`} transform={itemTf(p.type, p.gx, p.gy, p.flip)}>{floorArt(p.type).art()}</g>
            ))}
          </g>
        )
      })()}
      {coins.map((c) => (
        <g key={c.id} transform={`translate(${c.x} ${c.y})`} pointerEvents="none">
          <g className="coinpop">
            <circle r="6" fill="#ffc233" stroke={OL} strokeWidth="1.8" />
            <circle r="3" fill="none" stroke="#b87400" strokeWidth="1.2" />
            <path d="M9 -8l1.6 -3.4l1.6 3.4l3.4 1.6l-3.4 1.6l-1.6 3.4l-1.6 -3.4l-3.4 -1.6z" fill="#fff" opacity="0.9" />
          </g>
        </g>
      ))}
      {placing && (
        <g transform={itemTf(placing.type, placing.gx, placing.gy, placing.flip)} opacity={ghostOk ? 0.85 : 0.45} pointerEvents="none">
          {floorArt(placing.type).art()}
        </g>
      )}
      {/* time-of-day lighting over the whole room */}
      {sky.ambientA > 0 && <rect x={minX} y={minY} width={width} height={height} fill={sky.ambient} opacity={sky.ambientA} clipPath="url(#roomClip)" style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />}
    </svg>
  )
}
