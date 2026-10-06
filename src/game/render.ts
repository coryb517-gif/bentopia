import { SIZE } from '../sim/engine'
import { artImage } from './art'

function canvas(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas')
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  const ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  return { c, ctx }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = (Math.PI / 5) * i - Math.PI / 2
    ctx[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  ctx.closePath()
}

/** Glass orb colors per ingredient: [highlight, mid, deep]. */
const ORBS = [
  ['#eef3ff', '#a3bbff', '#5573e8'],
  ['#e4fcff', '#86e4f2', '#25a2c4'],
  ['#efffe0', '#a6e36f', '#4aa52a'],
  ['#fff3e4', '#ffcf9f', '#e8964c'],
  ['#ffeee6', '#ff9f80', '#e2553a'],
  ['#fffcd0', '#f5e64e', '#cfb000'],
  ['#fff0f5', '#ffa8c8', '#e0508a'],
  ['#f3ecff', '#c4a8ff', '#7a4fe0'],
  ['#fff4dc', '#ffc880', '#e08a2a'],
  ['#fff0ff', '#ff9fe0', '#b04fe0'],
  ['#fff4d6', '#ffb347', '#e0602a'],
]

/** Logical canvas size of a tile texture relative to the plate diameter. */
export const TILE_PAD = 1.3

/**
 * A glossy glass orb with a bright plate in the middle for the dish.
 * Tier shows in the ring and a shape badge, never color alone.
 */
export function tileCanvas(kind: number, tier: number, plate: number, dpr: number): HTMLCanvasElement {
  const size = plate * TILE_PAD
  const { c, ctx } = canvas(size, size, dpr)
  const cx = size / 2
  const cy = size / 2
  const r = plate / 2
  const [hi, mid, deep] = ORBS[kind]

  // glow + body
  ctx.save()
  ctx.shadowColor = tier === 2 ? 'rgba(255, 196, 60, 0.85)' : tier === 1 ? 'rgba(125, 255, 196, 0.7)' : `${mid}aa`
  ctx.shadowBlur = plate * (tier ? 0.24 : 0.16)
  ctx.shadowOffsetY = tier ? 0 : plate * 0.04
  const body = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.05, cx, cy, r)
  body.addColorStop(0, hi)
  body.addColorStop(0.5, mid)
  body.addColorStop(1, deep)
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // tier ring
  if (tier === 1) {
    ctx.lineWidth = plate * 0.05
    ctx.strokeStyle = '#7dffc4'
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.025, 0, Math.PI * 2)
    ctx.stroke()
  } else if (tier === 2) {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#fff3a6')
    g.addColorStop(0.3, '#ffb62e')
    g.addColorStop(0.55, '#ff7fb0')
    g.addColorStop(0.8, '#7fe6ff')
    g.addColorStop(1, '#fff3a6')
    ctx.lineWidth = plate * 0.065
    ctx.strokeStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.032, 0, Math.PI * 2)
    ctx.stroke()
  }

  // bright plate for the dish, with a soft inner shadow so it reads as recessed
  const pr = r * 0.8
  const face = ctx.createRadialGradient(cx - pr * 0.3, cy - pr * 0.4, pr * 0.1, cx, cy, pr)
  face.addColorStop(0, '#ffffff')
  face.addColorStop(1, tier === 2 ? '#fff0c4' : hi)
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.arc(cx, cy, pr, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = plate * 0.03
  ctx.strokeStyle = 'rgba(20, 8, 40, 0.22)'
  ctx.beginPath()
  ctx.arc(cx, cy, pr, Math.PI * 0.95, Math.PI * 1.6)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.beginPath()
  ctx.arc(cx, cy, pr, Math.PI * 1.95, Math.PI * 2.6)
  ctx.stroke()

  // the dish, large and with a grounded shadow
  const a = plate * 0.92
  ctx.save()
  ctx.shadowColor = 'rgba(30, 10, 50, 0.3)'
  ctx.shadowBlur = plate * 0.05
  ctx.shadowOffsetY = plate * 0.03
  ctx.drawImage(artImage(kind, tier), cx - a / 2, cy - a / 2 - plate * 0.015, a, a)
  ctx.restore()

  // glass: top gloss across the orb and a crisp specular arc
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  const gloss = ctx.createLinearGradient(cx, cy - r, cx, cy)
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gloss
  ctx.beginPath()
  ctx.ellipse(cx, cy - r * 0.45, r * 0.78, r * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.lineCap = 'round'
  ctx.lineWidth = plate * 0.035
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.beginPath()
  ctx.arc(cx, cy, r - plate * 0.07, Math.PI * 1.08, Math.PI * 1.34)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx + r * 0.2, cy - r * 0.82, plate * 0.018, 0, Math.PI * 2)
  ctx.fill()

  // crisp edge
  ctx.lineWidth = Math.max(1.2, plate * 0.022)
  ctx.strokeStyle = 'rgba(24, 10, 44, 0.75)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // shape badges
  if (tier === 1) {
    const bx = cx + r * 0.7
    const by = cy - r * 0.7
    ctx.fillStyle = '#2fe3a0'
    ctx.strokeStyle = 'rgba(24, 10, 44, 0.85)'
    ctx.lineWidth = plate * 0.025
    ctx.beginPath()
    ctx.arc(bx, by, plate * 0.11, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(bx, by, plate * 0.04, 0, Math.PI * 2)
    ctx.fill()
  } else if (tier === 2) {
    ctx.save()
    ctx.shadowColor = 'rgba(255, 200, 60, 0.9)'
    ctx.shadowBlur = plate * 0.1
    ctx.fillStyle = '#ffd23a'
    ctx.strokeStyle = 'rgba(24, 10, 44, 0.85)'
    ctx.lineWidth = plate * 0.025
    star(ctx, cx + r * 0.72, cy - r * 0.72, plate * 0.18, plate * 0.08)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
  return c
}

/** The bento box: black lacquer with gold inlay, a dark glass well and glass compartments. */
export function boardCanvas(blocked: boolean[], size: number, dpr: number): HTMLCanvasElement {
  const { c, ctx } = canvas(size, size, dpr)
  const pad = size * 0.032
  const cell = (size - pad * 2) / SIZE
  const radius = size * 0.05

  // lacquer shell
  const shell = ctx.createLinearGradient(0, 0, size, size)
  shell.addColorStop(0, '#3a1f4d')
  shell.addColorStop(1, '#170a26')
  ctx.fillStyle = shell
  roundRect(ctx, 0, 0, size, size, radius)
  ctx.fill()
  // gold-to-pink rim
  const rim = ctx.createLinearGradient(0, 0, size, size)
  rim.addColorStop(0, '#ffe08a')
  rim.addColorStop(0.5, '#ff7fb0')
  rim.addColorStop(1, '#ffb23e')
  ctx.strokeStyle = rim
  ctx.lineWidth = Math.max(2.5, size * 0.007)
  roundRect(ctx, 1.5, 1.5, size - 3, size - 3, radius)
  ctx.stroke()
  // inlay line
  ctx.strokeStyle = 'rgba(255, 214, 130, 0.45)'
  ctx.lineWidth = 1.2
  roundRect(ctx, pad * 0.45, pad * 0.45, size - pad * 0.9, size - pad * 0.9, radius * 0.8)
  ctx.stroke()
  // top-left sheen on the shell
  const sheen = ctx.createLinearGradient(0, 0, size * 0.7, size * 0.7)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = sheen
  roundRect(ctx, 0, 0, size, size, radius)
  ctx.fill()

  // well
  const wx = pad * 0.8
  const ww = size - pad * 1.6
  const well = ctx.createRadialGradient(size * 0.5, size * 0.4, size * 0.05, size * 0.5, size * 0.5, size * 0.7)
  well.addColorStop(0, '#2b1a4a')
  well.addColorStop(1, '#0f0720')
  ctx.fillStyle = well
  roundRect(ctx, wx, wx, ww, ww, radius * 0.7)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  // glass compartments
  const gap = cell * 0.06
  for (let i = 0; i < SIZE * SIZE; i++) {
    const x = pad + (i % SIZE) * cell + gap
    const y = pad + Math.floor(i / SIZE) * cell + gap
    const w = cell - gap * 2
    if (blocked[i]) {
      ctx.fillStyle = 'rgba(255, 214, 130, 0.5)'
      ctx.beginPath()
      ctx.moveTo(x + w / 2, y + w * 0.3)
      ctx.lineTo(x + w * 0.7, y + w / 2)
      ctx.lineTo(x + w / 2, y + w * 0.7)
      ctx.lineTo(x + w * 0.3, y + w / 2)
      ctx.closePath()
      ctx.fill()
      continue
    }
    const glass = ctx.createLinearGradient(x, y, x, y + w)
    glass.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
    glass.addColorStop(1, 'rgba(255, 255, 255, 0.04)')
    ctx.fillStyle = glass
    roundRect(ctx, x, y, w, w, cell * 0.2)
    ctx.fill()
    const edge = ctx.createLinearGradient(x, y, x + w, y + w)
    edge.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
    edge.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)')
    edge.addColorStop(1, 'rgba(255, 140, 190, 0.3)')
    ctx.strokeStyle = edge
    ctx.lineWidth = Math.max(1, cell * 0.02)
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, w - 1, cell * 0.2)
    ctx.stroke()
  }
  return c
}

/** Geometry shared by the renderer and hit testing. */
export function boardGeometry(size: number) {
  const pad = size * 0.032
  return { pad, cell: (size - pad * 2) / SIZE }
}

/** A frosted pane laid over a frozen tile. Two layers look thicker and whiter; one layer has cracked. */
export function iceCanvas(layers: number, plate: number, dpr: number): HTMLCanvasElement {
  const size = plate * TILE_PAD
  const { c, ctx } = canvas(size, size, dpr)
  const cx = size / 2
  const r = plate / 2
  const x = cx - r * 0.98
  const w = r * 1.96
  const thick = layers >= 2

  const g = ctx.createLinearGradient(x, x, x + w, x + w)
  g.addColorStop(0, thick ? 'rgba(235, 248, 255, 0.62)' : 'rgba(215, 240, 255, 0.4)')
  g.addColorStop(1, thick ? 'rgba(120, 190, 245, 0.7)' : 'rgba(130, 200, 250, 0.46)')
  ctx.save()
  ctx.shadowColor = 'rgba(150, 215, 255, 0.9)'
  ctx.shadowBlur = plate * 0.12
  roundRect(ctx, x, x, w, w, plate * 0.26)
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
  roundRect(ctx, x, x, w, w, plate * 0.26)
  ctx.lineWidth = Math.max(1.5, plate * 0.045)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.stroke()

  // glassy streaks
  ctx.save()
  roundRect(ctx, x, x, w, w, plate * 0.26)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = plate * 0.06
  ctx.lineCap = 'round'
  ;[[0.18, 0.5], [0.3, 0.38]].forEach(([a, b]) => {
    ctx.beginPath()
    ctx.moveTo(x + w * a, x + w * 0.1)
    ctx.lineTo(x + w * 0.1, x + w * b)
    ctx.stroke()
  })
  // a crack on thin ice shows it is about to give
  if (!thick) {
    ctx.strokeStyle = 'rgba(70, 120, 190, 0.75)'
    ctx.lineWidth = plate * 0.035
    ctx.beginPath()
    ctx.moveTo(x + w * 0.62, x + w * 0.08)
    ctx.lineTo(x + w * 0.5, x + w * 0.38)
    ctx.lineTo(x + w * 0.66, x + w * 0.52)
    ctx.lineTo(x + w * 0.52, x + w * 0.9)
    ctx.stroke()
  }
  ctx.restore()

  // sparkle
  ctx.fillStyle = '#fff'
  star(ctx, x + w * 0.8, x + w * 0.22, plate * 0.08, plate * 0.025)
  ctx.fill()
  return c
}
