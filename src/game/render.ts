import { SIZE } from '../sim/engine'
import { artImage, OUTLINE } from './art'

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

/** Logical canvas size of a tile texture relative to the plate diameter. */
export const TILE_PAD = 1.14

/** A plate with the dish on it. Tier shows in the rim and a shape badge, never color alone. */
export function tileCanvas(kind: number, tier: number, plate: number, dpr: number): HTMLCanvasElement {
  const size = plate * TILE_PAD
  const { c, ctx } = canvas(size, size, dpr)
  const cx = size / 2
  const cy = size / 2 - plate * 0.01
  const r = plate / 2
  const ow = Math.max(1.5, plate * 0.035)

  // plate body with soft drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(59, 36, 23, 0.38)'
  ctx.shadowBlur = plate * 0.1
  ctx.shadowOffsetY = plate * 0.055
  const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r)
  if (tier === 2) {
    body.addColorStop(0, '#fffbe8')
    body.addColorStop(1, '#fbe4a6')
  } else {
    body.addColorStop(0, '#fffefa')
    body.addColorStop(1, '#efe2c6')
  }
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // rim
  if (tier === 1) {
    ctx.lineWidth = plate * 0.07
    ctx.strokeStyle = '#7fa650'
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.055, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = plate * 0.014
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.075, Math.PI * 1.05, Math.PI * 1.65)
    ctx.stroke()
  } else if (tier === 2) {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#ffe38a')
    g.addColorStop(0.5, '#f2a91f')
    g.addColorStop(1, '#ffd45e')
    ctx.lineWidth = plate * 0.085
    ctx.strokeStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.06, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = plate * 0.014
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.085, Math.PI * 1.05, Math.PI * 1.65)
    ctx.stroke()
  } else {
    ctx.lineWidth = plate * 0.02
    ctx.strokeStyle = 'rgba(184, 148, 96, 0.55)'
    ctx.beginPath()
    ctx.arc(cx, cy, r - plate * 0.07, 0, Math.PI * 2)
    ctx.stroke()
  }

  // outline
  ctx.lineWidth = ow
  ctx.strokeStyle = OUTLINE
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // the dish
  const a = plate * 0.88
  ctx.save()
  ctx.shadowColor = 'rgba(59, 36, 23, 0.22)'
  ctx.shadowBlur = plate * 0.04
  ctx.shadowOffsetY = plate * 0.025
  ctx.drawImage(artImage(kind, tier), cx - a / 2, cy - a / 2 - plate * 0.01, a, a)
  ctx.restore()

  // shape badges
  if (tier === 1) {
    const bx = cx + r * 0.68
    const by = cy - r * 0.68
    ctx.fillStyle = '#7fa650'
    ctx.strokeStyle = OUTLINE
    ctx.lineWidth = ow * 0.8
    ctx.beginPath()
    ctx.arc(bx, by, plate * 0.11, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(bx, by, plate * 0.035, 0, Math.PI * 2)
    ctx.fill()
  } else if (tier === 2) {
    ctx.fillStyle = '#ffc233'
    ctx.strokeStyle = OUTLINE
    ctx.lineWidth = ow * 0.8
    star(ctx, cx + r * 0.7, cy - r * 0.7, plate * 0.17, plate * 0.075)
    ctx.fill()
    ctx.stroke()
  }
  return c
}

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** The bento box: hinoki frame, lacquer dividers, recessed wooden compartments. */
export function boardCanvas(blocked: boolean[], size: number, dpr: number): HTMLCanvasElement {
  const { c, ctx } = canvas(size, size, dpr)
  const pad = size * 0.032
  const cell = (size - pad * 2) / SIZE
  const radius = size * 0.045

  // frame: hinoki with grain
  const wood = ctx.createLinearGradient(0, 0, size, size)
  wood.addColorStop(0, '#ecc994')
  wood.addColorStop(1, '#c4965a')
  ctx.fillStyle = wood
  roundRect(ctx, 0, 0, size, size, radius)
  ctx.fill()
  ctx.save()
  roundRect(ctx, 0, 0, size, size, radius)
  ctx.clip()
  const rnd = seeded(7)
  for (let i = 0; i < 46; i++) {
    const y = rnd() * size
    ctx.strokeStyle = `rgba(120, 74, 28, ${0.05 + rnd() * 0.08})`
    ctx.lineWidth = 0.6 + rnd() * 1.6
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(size * 0.3, y + rnd() * 10 - 5, size * 0.7, y + rnd() * 10 - 5, size, y + rnd() * 6 - 3)
    ctx.stroke()
  }
  ctx.restore()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  roundRect(ctx, 1.5, 1.5, size - 3, size - 3, radius)
  ctx.stroke()
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = Math.max(2, size * 0.006)
  roundRect(ctx, 0.5, 0.5, size - 1, size - 1, radius)
  ctx.stroke()

  // lacquer well
  const lac = ctx.createLinearGradient(pad, pad, size - pad, size - pad)
  lac.addColorStop(0, '#5b2418')
  lac.addColorStop(1, '#2e100a')
  ctx.fillStyle = lac
  roundRect(ctx, pad * 0.6, pad * 0.6, size - pad * 1.2, size - pad * 1.2, radius * 0.7)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'
  ctx.lineWidth = 2
  ctx.stroke()
  const sheen = ctx.createLinearGradient(pad, pad, size * 0.6, size * 0.6)
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  roundRect(ctx, pad * 0.6, pad * 0.6, size - pad * 1.2, size - pad * 1.2, radius * 0.7)
  ctx.fill()

  // compartments
  const gap = cell * 0.055
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (blocked[i]) continue
    const x = pad + (i % SIZE) * cell + gap
    const y = pad + Math.floor(i / SIZE) * cell + gap
    const w = cell - gap * 2
    const slot = ctx.createLinearGradient(x, y, x + w, y + w)
    slot.addColorStop(0, '#d9b27a')
    slot.addColorStop(1, '#ecc995')
    ctx.fillStyle = slot
    roundRect(ctx, x, y, w, w, cell * 0.17)
    ctx.fill()
    // inner shadow: dark top-left lip, light bottom-right lip
    const lip = ctx.createLinearGradient(x, y, x + w, y + w)
    lip.addColorStop(0, 'rgba(70,35,10,0.42)')
    lip.addColorStop(0.5, 'rgba(70,35,10,0)')
    lip.addColorStop(1, 'rgba(255,255,255,0.45)')
    ctx.strokeStyle = lip
    ctx.lineWidth = Math.max(2, cell * 0.05)
    roundRect(ctx, x + 1, y + 1, w - 2, w - 2, cell * 0.16)
    ctx.stroke()
  }
  return c
}

/** Geometry shared by the renderer and hit testing. */
export function boardGeometry(size: number) {
  const pad = size * 0.032
  return { pad, cell: (size - pad * 2) / SIZE }
}
