import { clamp, hexToRgb, hslToRgb, paletteSample, rgbToHsl } from './math'
import { getSprite } from './sprites'
import { emitterWorld, emittersOf } from './emitters'
import type { Simulation } from './simulation'
import type { KindId, PointerForce, SimParams } from './types'
import { Kind } from './types'

const SPRITE = 32

function dprCap(quality: SimParams['graphics']['quality']): number {
  if (quality === 'low') return 1
  if (quality === 'medium') return 1.1
  if (quality === 'ultra') return 1.5
  return 1.25
}

export class Renderer {
  view: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private trail: HTMLCanvasElement
  private trailCtx: CanvasRenderingContext2D
  private glow: HTMLCanvasElement
  private glowCtx: CanvasRenderingContext2D
  private w = 1
  private h = 1
  private tw = 1
  private th = 1
  private dpr = 1
  private bank: HTMLCanvasElement[][] = []
  private bankKey = ''
  private sky = '#0b0d12'
  private kaleido: HTMLCanvasElement | null = null
  private trailsOn = false
  private trailTick = 0
  private lastTX = new Float32Array(8000)
  private lastTY = new Float32Array(8000)

  constructor(view: HTMLCanvasElement) {
    this.view = view
    const ctx = view.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) throw new Error('Canvas 2D fehlt')
    this.ctx = ctx
    this.trail = document.createElement('canvas')
    this.glow = document.createElement('canvas')
    const t = this.trail.getContext('2d')
    const g = this.glow.getContext('2d')
    if (!t || !g) throw new Error('Offscreen-Canvas fehlt')
    this.trailCtx = t
    this.glowCtx = g
    this.lastTX.fill(-1e6)
    this.lastTY.fill(-1e6)
  }

  resize(cssW: number, cssH: number, scale: number, quality: SimParams['graphics']['quality']): void {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap(quality)) * scale
    this.dpr = dpr
    this.w = Math.max(2, Math.floor(cssW * dpr))
    this.h = Math.max(2, Math.floor(cssH * dpr))
    this.view.width = this.w
    this.view.height = this.h
    this.view.style.width = `${cssW}px`
    this.view.style.height = `${cssH}px`
    this.tw = Math.max(2, Math.floor(this.w * 0.5))
    this.th = Math.max(2, Math.floor(this.h * 0.5))
    this.trail.width = this.tw
    this.trail.height = this.th
    this.glow.width = Math.max(2, Math.floor(this.w / 4))
    this.glow.height = Math.max(2, Math.floor(this.h / 4))
    this.bankKey = ''
    this.lastTX.fill(-1e6)
    this.lastTY.fill(-1e6)
  }

  clearTrails(): void {
    this.trailCtx.clearRect(0, 0, this.trail.width, this.trail.height)
    this.lastTX.fill(-1e6)
    this.lastTY.fill(-1e6)
  }

  render(sim: Simulation, params: SimParams, pointers: PointerForce[], selectedEmitterId: string | null): void {
    const bg = params.color.background
    if (bg !== this.sky) this.sky = bg
    const ctx = this.ctx
    const w = this.w
    const h = this.h

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = this.sky
    ctx.fillRect(0, 0, w, h)

    if (params.graphics.trails) {
      this.fadeTrails(params.graphics.trailFade)
      this.stampTrails(sim, this.tw / w)
      ctx.globalAlpha = 0.52
      ctx.drawImage(this.trail, 0, 0, w, h)
      ctx.globalAlpha = 1
      this.trailsOn = true
    } else if (this.trailsOn) {
      this.clearTrails()
      this.trailsOn = false
    }

    this.refreshBank(params)
    this.drawParticles(ctx, sim, params)

    if (params.graphics.glow) {
      const g = this.glowCtx
      g.globalCompositeOperation = 'source-over'
      g.globalAlpha = 1
      g.drawImage(this.view, 0, 0, this.glow.width, this.glow.height)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = params.graphics.quality === 'ultra' ? 0.2 : 0.12
      ctx.drawImage(this.glow, 0, 0, w, h)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    this.drawBooms(ctx, sim, params)
    this.drawShapeGhost(ctx, sim, params)

    if (params.creative.kaleidoscope && params.creative.symmetry > 1) {
      this.drawKaleidoscope(params)
    }

    if (params.graphics.postEffects) {
      this.drawVignette()
      if (params.graphics.chromaticAberration) this.drawChroma()
    }

    this.drawBrush(ctx, params, pointers)
    this.drawEmitters(ctx, sim, params, selectedEmitterId)
  }

  private drawEmitters(
    ctx: CanvasRenderingContext2D,
    sim: Simulation,
    params: SimParams,
    selectedId: string | null,
  ): void {
    const items = emittersOf(params)
    if (!items.length) return
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    for (const em of items) {
      const { x, y } = emitterWorld(em, sim.width, sim.height)
      const px = x * this.dpr
      const py = y * this.dpr
      const on = em.enabled
      const sel = em.id === selectedId
      const accent = hexToRgb(params.color.accent)
      const a = on ? (sel ? 0.92 : 0.55) : 0.22
      const r = (sel ? 13 : 10) * this.dpr
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a})`
      ctx.lineWidth = Math.max(1.2, 1.4 * this.dpr)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(px, py, 2.4 * this.dpr, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a})`
      ctx.fill()
      const rad = (em.heading * Math.PI) / 180
      const len = (18 + em.speed * 0.08) * this.dpr
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + Math.cos(rad) * len, py + Math.sin(rad) * len)
      ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a * 0.85})`
      ctx.stroke()
      if (sel && em.cone > 2) {
        const half = (em.cone * Math.PI) / 360
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.arc(px, py, len * 0.85, rad - half, rad + half)
        ctx.closePath()
        ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.12)`
        ctx.fill()
      }
    }
    ctx.restore()
  }

  private fadeTrails(amount: number): void {
    const t = this.trailCtx
    const keep = clamp(0.58 + (1 - amount) * 0.26, 0.54, 0.84)
    t.globalCompositeOperation = 'destination-in'
    t.globalAlpha = keep
    t.fillStyle = '#fff'
    t.fillRect(0, 0, this.tw, this.th)
    this.trailTick++
    if ((this.trailTick & 7) === 0) {
      t.globalAlpha = 0.4
      t.fillRect(0, 0, this.tw, this.th)
    }
    t.globalAlpha = 1
    t.globalCompositeOperation = 'source-over'
  }

  private stampTrails(sim: Simulation, scale: number): void {
    const ctx = this.trailCtx
    const dpr = this.dpr * scale
    const lastX = this.lastTX
    const lastY = this.lastTY
    ctx.globalCompositeOperation = 'source-over'
    for (let i = 0; i < sim.count; i++) {
      if (sim.kind[i] === Kind.Spark) continue
      const dx = sim.x[i] - lastX[i]
      const dy = sim.y[i] - lastY[i]
      if (dx * dx + dy * dy < 7) continue
      lastX[i] = sim.x[i]
      lastY[i] = sim.y[i]
      const a = sim.a[i] * 0.26
      if (a < 0.04) continue
      const size = sim.size[i] * dpr * 0.68
      ctx.globalAlpha = a
      ctx.fillStyle = `rgb(${sim.r[i]},${sim.g[i]},${sim.b[i]})`
      ctx.fillRect(sim.x[i] * dpr - size * 0.4, sim.y[i] * dpr - size * 0.4, size * 0.8, size * 0.8)
    }
    ctx.globalAlpha = 1
  }

  private refreshBank(params: SimParams): void {
    const key = `${params.color.primary}|${params.color.secondary}|${params.color.accent}|${params.color.hueShift}|${params.color.saturation}|${params.color.brightness}`
    if (key === this.bankKey && this.bank.length) return
    this.bankKey = key
    const p = hexToRgb(params.color.primary)
    const s = hexToRgb(params.color.secondary)
    const a = hexToRgb(params.color.accent)
    this.bank = []
    for (let kind = 0; kind < 6; kind++) {
      const row: HTMLCanvasElement[] = []
      for (let slot = 0; slot < 6; slot++) {
        const rgb = paletteSample(p, s, a, slot / 5, params.color.hueShift, params.color.saturation, params.color.brightness)
        let [h, sat, lit] = rgbToHsl(rgb[0], rgb[1], rgb[2])
        if (kind === 0) lit *= 0.84
        if (kind === 2) lit = Math.min(1, lit + 0.2)
        if (kind === 3) lit *= 0.9
        const out = hslToRgb(h, sat, Math.max(0.08, Math.min(0.96, lit)))
        row.push(this.makeSoft(kind as KindId, out[0], out[1], out[2]))
      }
      this.bank.push(row)
    }
  }

  private makeSoft(kind: KindId, r: number, g: number, b: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = SPRITE
    canvas.height = SPRITE
    const c = canvas.getContext('2d')
    if (!c) return getSprite(kind, true)
    c.drawImage(getSprite(kind, true), 0, 0, SPRITE, SPRITE)
    c.globalCompositeOperation = 'source-atop'
    c.fillStyle = `rgb(${r},${g},${b})`
    c.fillRect(0, 0, SPRITE, SPRITE)
    return canvas
  }

  private drawParticles(ctx: CanvasRenderingContext2D, sim: Simulation, params: SimParams): void {
    const dpr = this.dpr
    const soft = params.graphics.softParticles
    const count = sim.count
    const vw = this.w
    const vh = this.h

    for (let pass = 0; pass < 2; pass++) {
      ctx.globalCompositeOperation = pass === 1 ? 'lighter' : 'source-over'
      for (let i = 0; i < count; i++) {
        if (sim.isAdditive(i) !== (pass === 1)) continue
        const x = sim.x[i] * dpr
        const y = sim.y[i] * dpr
        const size = sim.size[i] * dpr
        if (x < -size || y < -size || x > vw + size || y > vh + size) continue
        const a = sim.a[i]
        if (a < 0.02) continue
        ctx.globalAlpha = a > 1 ? 1 : a
        if (soft) {
          const sprite = this.bank[sim.kind[i]]?.[sim.slot[i]]
          if (sprite) ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2)
        } else {
          ctx.fillStyle = `rgb(${sim.r[i]},${sim.g[i]},${sim.b[i]})`
          ctx.fillRect(x - size * 0.35, y - size * 0.35, size * 0.7, size * 0.7)
        }
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  private drawBooms(ctx: CanvasRenderingContext2D, sim: Simulation, params: SimParams): void {
    if (!params.explosion?.enabled || !sim.events.length) return
    const glow = hexToRgb(params.color.glow)
    const flash = params.explosion.flash
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const e of sim.events) {
      if (e.kind !== 'boom') continue
      const t = Math.min(1, e.age / 0.5)
      const fade = (1 - t) * (1 - t)
      const power = Math.min(0.92, (e.energy / 240) * (0.34 + flash * 0.58))
      const alpha = fade * power
      if (alpha < 0.02) continue
      const x = e.x * this.dpr
      const y = e.y * this.dpr
      const outer = (28 + e.energy * 0.26) * this.dpr * (0.62 + flash * 0.55)
      const g = ctx.createRadialGradient(x, y, 0, x, y, outer)
      g.addColorStop(0, `rgba(255,252,246,${Math.min(0.95, alpha * 1.15)})`)
      g.addColorStop(0.16, `rgba(${glow[0]},${glow[1]},${glow[2]},${alpha})`)
      g.addColorStop(0.55, `rgba(${glow[0]},${glow[1]},${glow[2]},${alpha * 0.24})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, outer, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawShapeGhost(ctx: CanvasRenderingContext2D, sim: Simulation, params: SimParams): void {
    const ghost = params.shape?.ghost ?? 0
    if (!params.shape?.enabled || ghost < 0.02 || !sim.shapes.lines.length) return
    const glow = hexToRgb(params.color.glow)
    const accent = hexToRgb(params.color.accent)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineWidth = Math.max(1, 1.1 * this.dpr)
    ctx.lineCap = 'round'
    for (const line of sim.shapes.lines) {
      const depth = 0.45 + (0.55 - Math.min(0.55, Math.abs(line.z) * 0.25))
      const a = ghost * 0.28 * depth
      if (a < 0.02) continue
      ctx.strokeStyle = `rgba(${glow[0]},${glow[1]},${glow[2]},${a})`
      ctx.beginPath()
      ctx.moveTo(line.x1 * this.dpr, line.y1 * this.dpr)
      ctx.lineTo(line.x2 * this.dpr, line.y2 * this.dpr)
      ctx.stroke()
      ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a * 0.45})`
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawBrush(ctx: CanvasRenderingContext2D, params: SimParams, pointers: PointerForce[]): void {
    const accent = hexToRgb(params.color.accent)
    ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.32)`
    ctx.lineWidth = 1.2 * this.dpr
    const r = params.interaction.brushSize * this.dpr
    for (const p of pointers) {
      if (!p.active) continue
      ctx.beginPath()
      ctx.arc(p.x * this.dpr, p.y * this.dpr, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawKaleidoscope(params: SimParams): void {
    const out = this.ctx
    const folds = Math.max(2, params.creative.symmetry)
    const cx = this.w * 0.5
    const cy = this.h * 0.5
    if (!this.kaleido || this.kaleido.width !== this.w || this.kaleido.height !== this.h) {
      this.kaleido = document.createElement('canvas')
      this.kaleido.width = this.w
      this.kaleido.height = this.h
    }
    const snap = this.kaleido
    const sctx = snap.getContext('2d')
    if (!sctx) return
    sctx.drawImage(this.view, 0, 0)
    out.save()
    out.globalAlpha = 0.55
    out.globalCompositeOperation = 'lighter'
    for (let i = 1; i < folds; i++) {
      out.setTransform(1, 0, 0, 1, 0, 0)
      out.translate(cx, cy)
      out.rotate((Math.PI * 2 * i) / folds)
      if (i % 2) out.scale(-1, 1)
      out.translate(-cx, -cy)
      out.drawImage(snap, 0, 0)
    }
    out.restore()
    out.setTransform(1, 0, 0, 1, 0, 0)
  }

  private drawChroma(): void {
    const out = this.ctx
    if (!this.kaleido || this.kaleido.width !== this.w || this.kaleido.height !== this.h) {
      this.kaleido = document.createElement('canvas')
      this.kaleido.width = this.w
      this.kaleido.height = this.h
    }
    const snap = this.kaleido
    const sctx = snap.getContext('2d')
    if (!sctx) return
    sctx.drawImage(this.view, 0, 0)
    const shift = Math.max(1, this.dpr * 1.15)
    out.save()
    out.globalCompositeOperation = 'screen'
    out.globalAlpha = 0.16
    out.drawImage(snap, shift, 0)
    out.globalAlpha = 0.11
    out.drawImage(snap, -shift, 0)
    out.restore()
    out.globalCompositeOperation = 'source-over'
    out.globalAlpha = 1
  }

  private drawVignette(): void {
    const out = this.ctx
    const g = out.createRadialGradient(
      this.w * 0.5,
      this.h * 0.5,
      this.w * 0.28,
      this.w * 0.5,
      this.h * 0.5,
      this.w * 0.78,
    )
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.28)')
    out.fillStyle = g
    out.fillRect(0, 0, this.w, this.h)
  }
}
