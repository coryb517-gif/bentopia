import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Sprite as PixiSprite, Texture } from 'pixi.js'
import { canExtend, commitChain, isValidChain, newGame, SIZE } from '../sim/engine'
import type { GameState, LevelDef, Tile } from '../sim/types'
import { loadAllArt } from './art'
import { clackSound, loseSound, popSound, winSound } from './audio'
import { boardCanvas, boardGeometry, tileCanvas, TILE_PAD } from './render'

interface Props {
  level: LevelDef
  seed: number
  onState: (s: GameState) => void
  /** The tile the current chain would produce, or null when no valid chain is selected. */
  onPreview: (t: { kind: number; tier: number } | null) => void
  /** Fired after each committed chain with its length and the tier it produced. */
  onMerge?: (len: number, tier: number) => void
}

interface Sprite {
  node: Container
  tx: number
  ty: number
  ts: number
  dying: boolean
  pop: number
  phase: number
  fs: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  r: number
  color: number
}

const BURST = [0xffc233, 0xf2a0a8, 0x7fa650, 0xffffff]

export default function BoardView({ level, seed, onState, onPreview, onMerge }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef({ onState, onPreview, onMerge })
  cb.current = { onState, onPreview, onMerge }

  useEffect(() => {
    const el = host.current!
    const app = new Application()
    let inited = false
    let destroyed = false
    let teardown = () => {}

    void (async () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let size = Math.min(el.clientWidth || 360, 560)
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      await loadAllArt()
      await app.init({
        width: size,
        height: size,
        antialias: true,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      inited = true
      if (destroyed) {
        inited = false
        app.destroy(true, { children: true })
        return
      }
      el.appendChild(app.canvas)
      app.canvas.style.touchAction = 'none'

      let state = newGame(level, seed)
      let path: number[] = []
      let dragging = false
      let { pad, cell } = boardGeometry(size)
      const sprites = new Map<number, Sprite>()
      const boardSprite = new PixiSprite()
      const lines = new Graphics()
      const tiles = new Container()
      const fx = new Graphics()
      app.stage.addChild(boardSprite, tiles, lines, fx)
      let particles: Particle[] = []
      cb.current.onState(state)

      const center = (i: number) => ({ x: pad + ((i % SIZE) + 0.5) * cell, y: pad + (Math.floor(i / SIZE) + 0.5) * cell })

      // Textures are drawn at the current size and cached per dish.
      let textures = new Map<string, Texture>()
      const textureFor = (kind: number, tier: number) => {
        const key = `${kind}-${tier}`
        let tex = textures.get(key)
        if (!tex) {
          tex = Texture.from(tileCanvas(kind, tier, cell * 0.94, dpr))
          textures.set(key, tex)
        }
        return tex
      }

      const drawBg = () => {
        boardSprite.texture?.destroy(true)
        boardSprite.texture = Texture.from(boardCanvas(state.blocked, size, dpr))
        boardSprite.width = size
        boardSprite.height = size
        for (const tex of textures.values()) tex.destroy(true)
        textures = new Map()
      }

      const makeNode = (t: Tile) => {
        const node = new Container()
        const face = new PixiSprite(textureFor(t.kind, t.tier))
        face.anchor.set(0.5)
        face.width = face.height = cell * 0.94 * TILE_PAD
        node.addChild(face)
        tiles.addChild(node)
        return node
      }

      const placeSprites = (spawnFromAbove: boolean, popId?: number) => {
        const live = new Set<number>()
        const mergeTo = state.last ? center(state.last.toCell) : null
        state.cells.forEach((t, i) => {
          if (!t) return
          live.add(t.id)
          const p = center(i)
          let sp = sprites.get(t.id)
          if (!sp) {
            const node = makeNode(t)
            const fs = (node.children[0] as PixiSprite).scale.x
            sp = { node, tx: p.x, ty: p.y, ts: 1, dying: false, pop: t.id === popId ? 1 : 0, phase: t.id * 1.7, fs }
            node.x = p.x
            node.y = spawnFromAbove && t.id !== popId ? -cell * (1 + Math.random() * 2) : p.y
            node.scale.set(t.id === popId ? 0.5 : 1)
            sprites.set(t.id, sp)
          }
          sp.tx = p.x
          sp.ty = p.y
          sp.ts = path.includes(i) ? 1.14 : 1
        })
        for (const [id, sp] of sprites) {
          if (live.has(id) || sp.dying) continue
          sp.dying = true
          sp.ts = 0
          if (mergeTo && state.last?.removed.includes(id)) {
            sp.tx = mergeTo.x
            sp.ty = mergeTo.y
          }
        }
      }

      const rebuild = () => {
        for (const sp of sprites.values()) sp.node.destroy({ children: true })
        sprites.clear()
        drawBg()
        placeSprites(false)
        for (const sp of sprites.values()) {
          sp.node.x = sp.tx
          sp.node.y = sp.ty
        }
      }
      rebuild()

      app.ticker.add((tk) => {
        const k = reduce ? 1 : 1 - Math.exp(-tk.deltaMS * 0.018)
        const now = performance.now() / 650
        for (const [id, sp] of sprites) {
          sp.node.x += (sp.tx - sp.node.x) * k
          sp.node.y += (sp.ty - sp.node.y) * k
          const s = sp.node.scale.x + (sp.ts - sp.node.scale.x) * k
          sp.node.scale.set(s)
          const face = sp.node.children[0] as PixiSprite
          if (!reduce && !sp.dying) {
            // Gentle idle bob, each tile on its own phase.
            face.y = Math.sin(now + sp.phase) * cell * 0.018
            if (sp.pop > 0) {
              sp.pop = Math.max(0, sp.pop - tk.deltaMS / 320)
              face.scale.set(sp.fs * (1 + 0.32 * Math.sin(Math.PI * sp.pop)))
            }
          }
          if (sp.dying && s < 0.06) {
            sp.node.destroy({ children: true })
            sprites.delete(id)
          }
        }
      })

      let rings: { x: number; y: number; t: number; color: number }[] = []
      app.ticker.add((tk) => {
        fx.clear()
        const dt = tk.deltaMS / 16.7
        rings = rings.filter((r) => r.t < 1)
        for (const r of rings) {
          r.t += 0.045 * dt
          fx.circle(r.x, r.y, cell * (0.3 + r.t * 1.5)).stroke({ width: cell * 0.12 * (1 - r.t), color: r.color, alpha: 1 - r.t })
        }
        if (!particles.length) return
        particles = particles.filter((p) => p.life > 0)
        for (const p of particles) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.vy += 0.16 * dt
          p.life -= 0.022 * dt
          fx.circle(p.x, p.y, p.r * Math.max(p.life, 0)).fill({ color: p.color, alpha: Math.min(1, p.life * 1.6) })
        }
      })

      const burst = (cellIdx: number, tier: number) => {
        if (reduce) return
        const c = center(cellIdx)
        rings.push({ x: c.x, y: c.y, t: 0, color: tier >= 2 ? 0xffd23a : 0xffffff })
        if (tier >= 2) {
          el.classList.remove('shake')
          void el.offsetWidth
          el.classList.add('shake')
        }
        const n = tier >= 2 ? 34 : 18
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2
          const v = (1.5 + Math.random() * 3.2) * (cell / 60)
          particles.push({
            x: c.x,
            y: c.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v - 1.2,
            life: 1,
            r: cell * (0.05 + Math.random() * 0.07),
            color: BURST[i % BURST.length],
          })
        }
      }

      const drawPath = () => {
        lines.clear()
        if (path.length > 1) {
          const pts = path.map(center)
          lines.moveTo(pts[0].x, pts[0].y)
          for (const p of pts.slice(1)) lines.lineTo(p.x, p.y)
          lines.stroke({ width: cell * 0.26, color: 0xf2a0a8, cap: 'round', join: 'round', alpha: 0.28 })
          lines.moveTo(pts[0].x, pts[0].y)
          for (const p of pts.slice(1)) lines.lineTo(p.x, p.y)
          lines.stroke({ width: cell * 0.11, color: 0xff6f91, cap: 'round', join: 'round', alpha: 0.95 })
        }
        for (const i of path) {
          const p = center(i)
          lines.circle(p.x, p.y, cell * 0.48).stroke({ width: Math.max(2, cell * 0.06), color: 0xff6f91, alpha: 0.9 })
        }
        const t0 = path.length ? state.cells[path[0]] : null
        cb.current.onPreview(t0 && isValidChain(state, path) ? { kind: t0.kind, tier: t0.tier + 1 } : null)
        for (const [id, sp] of sprites) {
          if (sp.dying) continue
          const idx = state.cells.findIndex((t) => t?.id === id)
          sp.ts = path.includes(idx) ? 1.14 : 1
        }
      }

      const cellAt = (e: PointerEvent, strict: boolean): number | null => {
        const rect = app.canvas.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * size
        const y = ((e.clientY - rect.top) / rect.height) * size
        const c = Math.floor((x - pad) / cell)
        const r = Math.floor((y - pad) / cell)
        if (c < 0 || r < 0 || c >= SIZE || r >= SIZE) return null
        const i = r * SIZE + c
        if (state.blocked[i]) return null
        if (strict) {
          const p = center(i)
          // Central hit zone keeps diagonal drags from misfiring.
          if (Math.hypot(x - p.x, y - p.y) > cell * 0.4) return null
        }
        return i
      }

      const commit = () => {
        const next = commitChain(state, path)
        if (next === state) return
        const chainLen = path.length
        path = []
        state = next
        clackSound()
        if (next.last) cb.current.onMerge?.(chainLen, next.cells[next.last.toCell]?.tier ?? 1)
        placeSprites(true, state.last?.resultId)
        if (state.last) burst(state.last.toCell, state.cells[state.last.toCell]?.tier ?? 1)
        drawPath()
        cb.current.onState(state)
        if (state.status === 'won') winSound()
        if (state.status === 'lost') loseSound()
      }

      const step = (i: number) => {
        if (path.length >= 2 && path[path.length - 2] === i) {
          path.pop()
          popSound(path.length)
        } else if (path.length && canExtend(state, path, i)) {
          path.push(i)
          popSound(path.length)
        } else return
        drawPath()
      }

      const down = (e: PointerEvent) => {
        if (state.status !== 'playing') return
        const i = cellAt(e, false)
        if (i === null) return
        app.canvas.setPointerCapture(e.pointerId)
        // Tap-to-link: a selection left over from a previous tap can be extended or committed.
        if (path.length) {
          if (path[path.length - 1] === i && path.length >= 3) return commit()
          const before = path.length
          step(i)
          if (path.length !== before) {
            dragging = true
            return
          }
        }
        path = [i]
        dragging = true
        popSound(1)
        drawPath()
      }
      const move = (e: PointerEvent) => {
        if (!dragging || state.status !== 'playing') return
        const i = cellAt(e, true)
        if (i !== null && path[path.length - 1] !== i) step(i)
      }
      const up = () => {
        if (!dragging) return
        dragging = false
        if (path.length >= 3) commit()
        else if (path.length !== 1) {
          path = []
          drawPath()
        }
        // A lone tapped tile stays selected so the player can tap the rest of the chain.
      }
      app.canvas.addEventListener('pointerdown', down)
      app.canvas.addEventListener('pointermove', move)
      app.canvas.addEventListener('pointerup', up)
      app.canvas.addEventListener('pointercancel', up)

      const ro = new ResizeObserver(() => {
        const next = Math.min(el.clientWidth || size, 560)
        if (Math.abs(next - size) < 2) return
        size = next
        ;({ pad, cell } = boardGeometry(size))
        app.renderer.resize(size, size)
        rebuild()
        drawPath()
      })
      ro.observe(el)

      teardown = () => {
        ro.disconnect()
        app.canvas.removeEventListener('pointerdown', down)
        app.canvas.removeEventListener('pointermove', move)
        app.canvas.removeEventListener('pointerup', up)
        app.canvas.removeEventListener('pointercancel', up)
      }
    })()

    return () => {
      destroyed = true
      teardown()
      if (inited) app.destroy(true, { children: true })
    }
  }, [level, seed])

  return <div ref={host} className="board-host" />
}
