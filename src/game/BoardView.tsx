import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'
import { canExtend, commitChain, isValidChain, newGame, SIZE } from '../sim/engine'
import { CHAINS } from '../sim/items'
import type { GameState, LevelDef, Tile } from '../sim/types'
import { clackSound, loseSound, popSound, winSound } from './audio'

interface Props {
  level: LevelDef
  seed: number
  onState: (s: GameState) => void
  /** The tile the current chain would produce, or null when no valid chain is selected. */
  onPreview: (t: { kind: number; tier: number } | null) => void
}

interface Sprite {
  node: Container
  tx: number
  ty: number
  ts: number
  dying: boolean
}

const RIM = [0x8a6a3a, 0x7fa650, 0xffb23e]

export default function BoardView({ level, seed, onState, onPreview }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef({ onState, onPreview })
  cb.current = { onState, onPreview }

  useEffect(() => {
    const el = host.current!
    const app = new Application()
    let inited = false
    let destroyed = false
    let teardown = () => {}

    void (async () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let size = Math.min(el.clientWidth || 360, 560)
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
      let cell = size / SIZE
      const sprites = new Map<number, Sprite>()
      const bg = new Graphics()
      const lines = new Graphics()
      const tiles = new Container()
      app.stage.addChild(bg, tiles, lines)
      cb.current.onState(state)

      const center = (i: number) => ({ x: (i % SIZE + 0.5) * cell, y: (Math.floor(i / SIZE) + 0.5) * cell })

      const drawBg = () => {
        bg.clear()
        bg.roundRect(0, 0, size, size, cell * 0.35).fill(0xd9b07a)
        for (let i = 0; i < SIZE * SIZE; i++) {
          if (state.blocked[i]) continue
          const p = center(i)
          const pad = cell * 0.06
          bg.roundRect(p.x - cell / 2 + pad, p.y - cell / 2 + pad, cell - pad * 2, cell - pad * 2, cell * 0.2).fill(0xc29a63)
        }
        for (let i = 0; i < SIZE * SIZE; i++) {
          if (!state.blocked[i]) continue
          const p = center(i)
          bg.roundRect(p.x - cell / 2, p.y - cell / 2, cell, cell, cell * 0.2).fill(0x5a3a1c)
        }
      }

      const makeNode = (t: Tile) => {
        const node = new Container()
        const r = cell * 0.42
        const g = new Graphics()
        g.circle(0, 0, r).fill(0xfffdf7).stroke({ width: Math.max(2, cell * (t.tier ? 0.07 : 0.03)), color: RIM[t.tier] })
        // Shape badges so tier never relies on color alone: dot = crafted, star = dish.
        if (t.tier === 1) g.circle(r * 0.7, -r * 0.7, cell * 0.08).fill(0x7fa650)
        if (t.tier === 2) g.star(r * 0.7, -r * 0.7, 5, cell * 0.14, cell * 0.06).fill(0xffb23e).stroke({ width: 1, color: 0x2b2f5c })
        const label = new Text({ text: CHAINS[t.kind].emoji[t.tier], style: { fontSize: cell * 0.56 } })
        label.anchor.set(0.5)
        node.addChild(g, label)
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
            sp = { node, tx: p.x, ty: p.y, ts: 1, dying: false }
            node.x = p.x
            node.y = spawnFromAbove ? -cell * (1 + Math.random() * 2) : p.y
            node.scale.set(t.id === popId ? 0.4 : 1)
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
        for (const [id, sp] of sprites) {
          sp.node.x += (sp.tx - sp.node.x) * k
          sp.node.y += (sp.ty - sp.node.y) * k
          const s = sp.node.scale.x + (sp.ts - sp.node.scale.x) * k
          sp.node.scale.set(s)
          if (sp.dying && s < 0.06) {
            sp.node.destroy({ children: true })
            sprites.delete(id)
          }
        }
      })

      const drawPath = () => {
        lines.clear()
        if (path.length > 1) {
          const pts = path.map(center)
          lines.moveTo(pts[0].x, pts[0].y)
          for (const p of pts.slice(1)) lines.lineTo(p.x, p.y)
          lines.stroke({ width: cell * 0.14, color: 0xf2a0a8, cap: 'round', join: 'round', alpha: 0.9 })
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
        const c = Math.floor(x / cell)
        const r = Math.floor(y / cell)
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
        path = []
        state = next
        clackSound()
        placeSprites(true, state.last?.resultId)
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
        cell = size / SIZE
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
