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
}

interface Sprite {
  node: Container
  tx: number
  ty: number
  ts: number
  dying: boolean
}

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
      app.stage.addChild(boardSprite, tiles, lines)
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
