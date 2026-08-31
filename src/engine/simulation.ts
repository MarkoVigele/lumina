import {
  Kind,
  EmitterMix,
  Intelligence,
  kiDrives,
  GradientMode,
  TimeMode,
  Mood,
  Tool,
  EdgeMode,
  type InterestingEvent,
  type KindId,
  type PointerForce,
  type SimParams,
} from './types'
import { clamp, curlNoise, hexToRgb, hslToRgb, noise3, paletteSample, rand, rgbToHsl, smoothstep, SpatialHash } from './math'
import { emitterWorld, emittersOf, kindForMix } from './emitters'
import { ShapeField } from './shapes'

const MAX = 8000
const neighborBuf = new Array<number>(256)
const blastBuf = new Array<number>(512)

const KIND_MASS = [0.55, 0.35, 0.18, 0.4, 0.7, 1.1]
const KIND_GLOW = [0.35, 1, 1, 0.25, 0.9, 0.7]
const ADDITIVE = [false, true, true, false, true, false]

function moodMods(mood: SimParams['creative']['mood']) {
  switch (mood) {
    case Mood.Calm:
      return { speed: 0.72, glow: 0.85, sep: 0.7, coh: 1.25, sat: 0.86 }
    case Mood.Curious:
      return { speed: 1.05, glow: 1, sep: 0.9, coh: 0.85, sat: 1 }
    case Mood.Tense:
      return { speed: 1.28, glow: 1.15, sep: 1.4, coh: 0.55, sat: 1.08 }
    case Mood.Joyful:
      return { speed: 1.18, glow: 1.25, sep: 0.8, coh: 1.1, sat: 1.15 }
    case Mood.Melancholic:
      return { speed: 0.62, glow: 0.7, sep: 0.85, coh: 1.05, sat: 0.72 }
    default:
      return { speed: 1, glow: 1, sep: 1, coh: 1, sat: 1 }
  }
}

function personalityMods(id: string) {
  switch (id) {
    case 'guarded':
      return { sep: 1.45, ali: 0.7, coh: 0.55, wander: 0.4 }
    case 'explorer':
      return { sep: 0.9, ali: 0.55, coh: 0.45, wander: 1.3 }
    case 'hive':
      return { sep: 0.7, ali: 1.2, coh: 1.45, wander: 0.25 }
    case 'hunter':
      return { sep: 1.1, ali: 0.8, coh: 0.5, wander: 0.7 }
    case 'poet':
      return { sep: 0.85, ali: 0.6, coh: 0.8, wander: 1.1 }
    case 'vortex':
      return { sep: 0.75, ali: 0.95, coh: 0.7, wander: 0.35 }
    case 'dancer':
      return { sep: 1.05, ali: 1.15, coh: 0.95, wander: 1.4 }
    case 'storm':
      return { sep: 1.55, ali: 0.45, coh: 0.35, wander: 1.7 }
    default:
      return { sep: 1, ali: 1, coh: 1, wander: 0.7 }
  }
}

function kindWeights(p: SimParams['physics']): number[] {
  return [
    p.onSmoke === false ? 0 : p.mixSmoke,
    p.onEmbers === false ? 0 : p.mixEmbers,
    p.onSparks === false ? 0 : p.mixSparks,
    p.onDust === false ? 0 : p.mixDust,
    p.onEnergy === false ? 0 : p.mixEnergy,
    p.onBlobs === false ? 0 : p.mixBlobs,
  ]
}

function pickKind(p: SimParams): KindId | -1 {
  const w = kindWeights(p.physics)
  const sum = w.reduce((a, b) => a + b, 0)
  if (sum <= 0) return -1
  let r = Math.random() * sum
  for (let i = 0; i < w.length; i++) {
    r -= w[i]
    if (r <= 0) return i as KindId
  }
  return Kind.Smoke
}

function timeScaleOf(p: SimParams): number {
  switch (p.creative.timeMode) {
    case TimeMode.Freeze:
      return 0
    case TimeMode.Slow:
      return 0.28 * Math.abs(p.creative.timeScale || 1)
    case TimeMode.Lapse:
      return 2.6 * Math.abs(p.creative.timeScale || 1)
    case TimeMode.Reverse:
      return -Math.abs(p.creative.timeScale || 0.7)
    default:
      return p.creative.timeScale || 1
  }
}

export class Simulation {
  count = 0
  x = new Float32Array(MAX)
  y = new Float32Array(MAX)
  vx = new Float32Array(MAX)
  vy = new Float32Array(MAX)
  life = new Float32Array(MAX)
  maxLife = new Float32Array(MAX)
  size = new Float32Array(MAX)
  hue = new Float32Array(MAX)
  sat = new Float32Array(MAX)
  lit = new Float32Array(MAX)
  energy = new Float32Array(MAX)
  geneA = new Float32Array(MAX)
  geneB = new Float32Array(MAX)
  geneC = new Float32Array(MAX)
  kind = new Uint8Array(MAX)
  swarm = new Uint8Array(MAX)
  hits = new Uint8Array(MAX)
  slot = new Uint8Array(MAX)
  boomCool = new Uint8Array(MAX)
  launch = new Float32Array(MAX)

  r = new Uint8Array(MAX)
  g = new Uint8Array(MAX)
  b = new Uint8Array(MAX)
  a = new Float32Array(MAX)

  width = 1600
  height = 900
  time = 0
  paused = false
  events: InterestingEvent[] = []
  shapes = new ShapeField()
  hash = new SpatialHash(72)
  spawnAcc = 0
  emitAcc = new Map<string, number>()
  frame = 0
  lastParams: SimParams | null = null
  private evolveCool = 0
  private colorCache = {
    p: [232, 180, 138] as [number, number, number],
    s: [124, 140, 168] as [number, number, number],
    a: [255, 155, 122] as [number, number, number],
    ph: [0.08, 0.55, 0.72] as [number, number, number],
    sh: [0.6, 0.18, 0.57] as [number, number, number],
    ah: [0.04, 0.7, 0.74] as [number, number, number],
  }

  resize(w: number, h: number): void {
    this.width = Math.max(8, w)
    this.height = Math.max(8, h)
  }

  clear(): void {
    this.count = 0
    this.events.length = 0
  }

  reset(params: SimParams): void {
    this.clear()
    this.time = 0
    const n = Math.min(900, Math.floor(params.graphics.particleCap * 0.28))
    for (let i = 0; i < n; i++) {
      const kind = pickKind(params)
      if (kind === -1) break
      this.spawn(
        params,
        rand(0, this.width),
        rand(0, this.height),
        rand(-20, 20),
        rand(-30, 8),
        kind,
      )
    }
  }

  spawn(
    params: SimParams,
    x: number,
    y: number,
    vx: number,
    vy: number,
    kind: KindId,
    inherit?: number,
  ): number {
    if (this.count >= Math.min(MAX, params.graphics.particleCap)) return -1
    const i = this.count++
    this.x[i] = x
    this.y[i] = y
    this.vx[i] = vx
    this.vy[i] = vy
    const life = params.physics.lifetime * rand(0.55, 1.35)
    this.life[i] = life
    this.maxLife[i] = life
    const jitter = 1 + (Math.random() * 2 - 1) * params.physics.sizeJitter
    const kindScale = [1.35, 0.55, 0.32, 0.7, 0.85, 1.55][kind]
    this.size[i] = Math.max(2, params.physics.size * jitter * kindScale)
    this.kind[i] = kind
    this.swarm[i] = params.swarm.multiSwarm
      ? kind === Kind.Blob || (kind === Kind.Energy && Math.random() > 0.55)
        ? 1
        : 0
      : 0
    this.hits[i] = 0
    this.boomCool[i] = 0
    this.energy[i] = kind === Kind.Spark ? 1 : rand(0.25, 0.7)
    if (inherit !== undefined && inherit >= 0) {
      this.geneA[i] = clamp(this.geneA[inherit] + rand(-0.08, 0.08), 0.15, 1.6)
      this.geneB[i] = clamp(this.geneB[inherit] + rand(-0.08, 0.08), 0.2, 1.8)
      this.geneC[i] = clamp(this.geneC[inherit] + rand(-0.04, 0.04), -0.7, 0.7)
    } else {
      this.geneA[i] = rand(0.45, 1.25)
      this.geneB[i] = rand(0.4, 1.4)
      this.geneC[i] = rand(-0.08, 0.08)
    }
    this.size[i] *= this.geneA[i]
    this.launch[i] = 0
    this.tint(i, params, 0)
    return i
  }

  private tint(i: number, params: SimParams, speed: number): void {
    const { p, s, a } = this.colorCache
    const age = 1 - this.life[i] / this.maxLife[i]
    const mode = params.color.gradientMode
    let t = age
    if (mode === GradientMode.Speed) {
      const cap = 28 + params.swarm.maxSpeed * 0.22
      t = smoothstep(clamp((speed - 4) / cap, 0, 1))
    } else if (mode === GradientMode.Energy) {
      t = clamp(this.energy[i] / 1.55, 0, 1)
    } else if (mode === GradientMode.Collision) {
      t = clamp(this.hits[i] / 4, 0, 1)
    } else if (mode === GradientMode.Noise) {
      t = 0.5 + 0.5 * noise3(this.x[i] * 0.006, this.y[i] * 0.006, this.time * 0.22)
    }

    t += this.geneC[i] * 0.55
    if (params.color.colorTurbulence > 0.02) {
      t += noise3(this.x[i] * 0.01, this.y[i] * 0.01, this.time * 0.28) * params.color.colorTurbulence * 0.32
    }
    t = clamp(t, 0, 1)

    let rgb = paletteSample(
      p,
      s,
      a,
      t,
      params.color.hueShift,
      params.color.saturation * moodMods(params.creative.mood).sat,
      params.color.brightness,
    )
    let [h, sat, lit] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    if (this.kind[i] === Kind.Smoke) lit *= 0.84
    if (this.kind[i] === Kind.Spark) lit = Math.min(1, lit + 0.22)
    if (this.kind[i] === Kind.Dust) lit *= 0.9
    if (this.energy[i] > 1) lit = Math.min(1, lit + 0.1)
    if (mode === GradientMode.Collision) lit = Math.min(1, lit + clamp(this.hits[i] * 0.05, 0, 0.2))
    rgb = hslToRgb(h, sat, clamp(lit, 0.08, 0.96))

    this.hue[i] = h
    this.sat[i] = sat
    this.lit[i] = lit
    this.r[i] = rgb[0]
    this.g[i] = rgb[1]
    this.b[i] = rgb[2]
    this.slot[i] = Math.max(0, Math.min(5, Math.floor(t * 5.99)))
    const fadeIn = clamp(age / 0.08, 0, 1)
    const fadeOut = clamp(this.life[i] / (this.maxLife[i] * 0.28), 0, 1)
    const baseA = [0.22, 0.85, 0.95, 0.38, 0.7, 0.5][this.kind[i]]
    this.a[i] = baseA * fadeIn * fadeOut
  }

  private refreshColors(params: SimParams): void {
    this.colorCache.p = hexToRgb(params.color.primary)
    this.colorCache.s = hexToRgb(params.color.secondary)
    this.colorCache.a = hexToRgb(params.color.accent)
    this.colorCache.ph = rgbToHsl(...this.colorCache.p)
    this.colorCache.sh = rgbToHsl(...this.colorCache.s)
    this.colorCache.ah = rgbToHsl(...this.colorCache.a)
  }

  brush(params: SimParams, pointers: PointerForce[], dt: number): void {
    const radius = params.interaction.brushSize
    const strength = params.interaction.brushStrength
    const folds = Math.max(1, params.creative.symmetry | 0)

    for (const ptr of pointers) {
      if (!ptr.active) continue
      const tool = ptr.tool ?? params.interaction.tool
      for (let f = 0; f < folds; f++) {
        const ang = (Math.PI * 2 * f) / folds
        const cx = this.width * 0.5
        const cy = this.height * 0.5
        const dx0 = ptr.x - cx
        const dy0 = ptr.y - cy
        const cos = Math.cos(ang)
        const sin = Math.sin(ang)
        const px = cx + dx0 * cos - dy0 * sin
        const py = cy + dx0 * sin + dy0 * cos

        if (tool === Tool.Paint || tool === Tool.Heal) {
          const rate = (tool === Tool.Paint ? 90 : 40) * strength * dt * 60
          this.spawnAcc += rate
          while (this.spawnAcc >= 1) {
            this.spawnAcc -= 1
            const a = Math.random() * Math.PI * 2
            const rad = Math.random() * radius * 0.55
            const kind = tool === Tool.Heal ? Kind.Energy : pickKind(params)
            if (kind === -1) break
            this.spawn(params, px + Math.cos(a) * rad, py + Math.sin(a) * rad, rand(-12, 12), rand(-18, 6), kind)
          }
        }

        if (tool === Tool.Cut) {
          this.slice(px, py, ptr.x - ptr.px, ptr.y - ptr.py, radius * 0.35)
        }
      }
    }
  }

  burst(params: SimParams, x: number, y: number, force: number, spawn = 0.2): void {
    const r = params.interaction.brushSize
    for (let i = 0; i < this.count; i++) {
      const dx = this.x[i] - x
      const dy = this.y[i] - y
      const d2 = dx * dx + dy * dy
      if (d2 > r * r || d2 < 0.01) continue
      const d = Math.sqrt(d2)
      const f = (1 - d / r) * force
      this.vx[i] += (dx / d) * f
      this.vy[i] += (dy / d) * f
      this.energy[i] = clamp(this.energy[i] + 0.35, 0, 2)
    }
    const n = Math.floor(18 * spawn * params.physics.secondarySparks + 4)
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2
      const s = rand(40, 180)
      this.spawn(params, x, y, Math.cos(a) * s, Math.sin(a) * s, Kind.Spark)
    }
    this.events.push({ x, y, energy: force, age: 0 })
  }

  detonate(params: SimParams, x: number, y: number, impact: number): void {
    const exp = params.explosion
    if (!exp) return
    const radius = Math.max(18, exp.radius)
    const punch = 210 * exp.force * (0.5 + clamp(impact / 150, 0, 1.7))
    const n = this.hash.queryRange(x, y, radius, blastBuf)
    const r2 = radius * radius
    for (let k = 0; k < n; k++) {
      const i = blastBuf[k]
      const dx = this.x[i] - x
      const dy = this.y[i] - y
      const d2 = dx * dx + dy * dy
      if (d2 > r2 || d2 < 0.04) continue
      const d = Math.sqrt(d2)
      const falloff = 1 - d / radius
      const f = punch * falloff * falloff
      this.vx[i] += (dx / d) * f
      this.vy[i] += (dy / d) * f
      this.energy[i] = clamp(this.energy[i] + 0.45 * falloff * exp.force, 0, 2)
      this.hits[i] = Math.min(255, this.hits[i] + 2)
      if (exp.shatter > 0.01) {
        this.life[i] *= 1 - exp.shatter * 0.22 * falloff
        this.vx[i] += rand(-40, 40) * exp.shatter * falloff
        this.vy[i] += rand(-40, 40) * exp.shatter * falloff
      }
      if (exp.chain > 0.02 && this.energy[i] > 1.15 && Math.random() < exp.chain * 0.12) {
        this.boomCool[i] = 0
        this.energy[i] = 2
      }
    }
    const sparkN = Math.min(22, Math.floor((5 + impact * 0.09) * exp.sparks * (0.45 + exp.force * 0.4)))
    for (let k = 0; k < sparkN; k++) {
      const a = Math.random() * Math.PI * 2
      const s = rand(70, 240) * (0.7 + exp.force * 0.45)
      this.spawn(params, x, y, Math.cos(a) * s, Math.sin(a) * s, Kind.Spark)
    }
    if (exp.shatter > 0.35 && Math.random() < exp.shatter) {
      const a = Math.random() * Math.PI * 2
      const s = rand(30, 90)
      this.spawn(params, x, y, Math.cos(a) * s, Math.sin(a) * s, Kind.Ember)
    }
    this.events.push({
      x,
      y,
      energy: impact * (0.35 + exp.force * 0.25) * (0.35 + exp.flash * 0.4),
      age: 0,
      kind: 'boom',
    })
  }

  private slice(x: number, y: number, vx: number, vy: number, width: number): void {
    const len = Math.hypot(vx, vy) || 1
    const nx = -vy / len
    const ny = vx / len
    for (let i = 0; i < this.count; i++) {
      const dx = this.x[i] - x
      const dy = this.y[i] - y
      const along = dx * (vx / len) + dy * (vy / len)
      if (along < -10 || along > len + 10) continue
      const side = dx * nx + dy * ny
      if (Math.abs(side) > width) continue
      this.vx[i] += nx * 90 * Math.sign(side || 1)
      this.vy[i] += ny * 90 * Math.sign(side || 1)
      this.life[i] *= 0.72
    }
  }

  throwAt(params: SimParams, ptr: PointerForce): void {
    const vx = (ptr.x - ptr.px) * 18 * params.interaction.brushStrength
    const vy = (ptr.y - ptr.py) * 18 * params.interaction.brushStrength
    const r = params.interaction.brushSize
    for (let i = 0; i < this.count; i++) {
      const dx = this.x[i] - ptr.x
      const dy = this.y[i] - ptr.y
      if (dx * dx + dy * dy > r * r) continue
      this.vx[i] += vx
      this.vy[i] += vy
    }
  }

  evolve(params: SimParams): void {
    const m = params.creative.mutationRate + 0.12
    for (let i = 0; i < this.count; i++) {
      this.geneA[i] = clamp(this.geneA[i] + rand(-m, m), 0.2, 1.8)
      this.geneB[i] = clamp(this.geneB[i] + rand(-m, m), 0.2, 1.8)
      this.geneC[i] = clamp(this.geneC[i] + rand(-m, m) * 0.85, -0.7, 0.7)
      this.size[i] *= 0.88 + this.geneA[i] * 0.12
      this.energy[i] = clamp(this.energy[i] + rand(0.15, 0.7), 0, 2)
      this.tint(i, params, Math.hypot(this.vx[i], this.vy[i]))
    }
    this.events.push({ x: this.width * 0.5, y: this.height * 0.5, energy: 110, age: 0 })
  }

  step(params: SimParams, pointers: PointerForce[], rawDt: number): void {
    this.lastParams = params
    this.refreshColors(params)
    if (this.paused) return

    const ts = timeScaleOf(params)
    const dt = clamp(rawDt, 0, 0.05) * ts
    const adt = Math.abs(dt)
    if (adt < 0.00001 && ts === 0) {
      this.brush(params, pointers, rawDt)
      return
    }

    this.time += adt
    this.evolveCool = Math.max(0, this.evolveCool - adt)
    if (params.creative.evolvePulse > 0.5 && this.evolveCool <= 0) {
      this.evolve(params)
      this.evolveCool = 4.5
    }

    this.ambientSpawn(params, adt)
    this.emitterSpawn(params, adt)
    this.brush(params, pointers, adt)

    const mood = moodMods(params.creative.mood)
    const pers = personalityMods(params.swarm.personality)
    const intel = params.swarm.intelligence
    const cell = Math.max(24, params.swarm.perception * 0.7)
    this.hash.cellSize = cell
    this.hash.clear()

    const cap = Math.min(this.count, params.graphics.particleCap)
    if (this.count > cap) this.count = cap

    for (let i = 0; i < this.count; i++) this.hash.insert(i, this.x[i], this.y[i])

    this.shapes.tick(params, adt, this.width, this.height, this.time)

    const cx = this.width * 0.5
    const cy = this.height * 0.5
    const heart = params.swarm.personality === 'hive' && params.swarm.seek > 0.7

    for (let i = 0; i < this.count; i++) {
      const kind = this.kind[i] as KindId
      const mass = KIND_MASS[kind] * (0.7 + this.geneA[i] * 0.4)
      let ax = 0
      let ay = 0

      ay += params.physics.gravity
      const lift = params.physics.buoyancy * (kind === Kind.Smoke || kind === Kind.Ember ? 1 : 0.35)
      ay -= lift * (0.6 + this.size[i] / 40)
      ax += params.physics.windX
      ay += params.physics.windY

      const curl = curlNoise(this.x[i], this.y[i], this.time * 0.35, params.physics.turbulenceScale)
      const turb = params.physics.turbulence * this.geneB[i]
      ax += curl.x * turb
      ay += curl.y * turb

      if (params.creative.reactiveEnv) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 0.7)
        const dx = this.x[i] - cx
        const dy = this.y[i] - cy
        const d = Math.hypot(dx, dy) || 1
        ax += (dx / d) * Math.sin(this.time * 0.35 + d * 0.01) * 18 * pulse
        ay += (dy / d) * Math.cos(this.time * 0.28 + d * 0.01) * 12 * pulse
        if (heart) {
          ax += ((cx - this.x[i]) * 0.35)
          ay += ((cy - this.y[i]) * 0.35)
        }
      }

      for (const ptr of pointers) {
        if (!ptr.active) continue
        const dx = this.x[i] - ptr.x
        const dy = this.y[i] - ptr.y
        const d2 = dx * dx + dy * dy
        const r = params.interaction.brushSize
        if (d2 > r * r || d2 < 1) continue
        const d = Math.sqrt(d2)
        const fall = (1 - d / r) * params.interaction.brushStrength
        const tool = ptr.tool ?? params.interaction.tool
        if (tool === Tool.Attract) {
          ax -= (dx / d) * 420 * fall
          ay -= (dy / d) * 420 * fall
        } else if (tool === Tool.Repel) {
          ax += (dx / d) * 460 * fall
          ay += (dy / d) * 460 * fall
        } else if (tool === Tool.Heal) {
          this.life[i] = Math.min(this.maxLife[i], this.life[i] + 1.2 * fall * adt)
          this.energy[i] = clamp(this.energy[i] + 0.4 * fall * adt, 0, 2)
        } else if (tool === Tool.Paint) {
          this.geneC[i] += 0.015 * fall
        }
      }

      const launched = this.launch[i] > 0
      if (launched) this.launch[i] = Math.max(0, this.launch[i] - adt)

      const form = params.shape
      const power = params.swarm.strength ?? 1
      let swarmW = !kiDrives(intel) || power < 0.04
        ? 0
        : intel === Intelligence.Creative
          ? power
          : [0.15, 0.4, 0.1, 0.85, 1, 1][kind] * power
      if (form?.enabled) swarmW *= Math.max(0.12, 1 - form.fold * 0.8)
      if (swarmW > 0 && (kind > 2 || intel === Intelligence.Creative || ((i + this.frame) & 1) === 0)) {
        const bx = ax
        const by = ay
        this.applySwarm(i, params, mood, pers, ax, ay, (nax, nay) => {
          ax = bx + (nax - bx) * swarmW
          ay = by + (nay - by) * swarmW
        })
      }

      let onWire = 999
      if (form?.enabled && form.attract > 0.02) {
        const pull = this.shapes.pull(i, this.x[i], this.y[i], form)
        const hold = launched ? 0.12 : 1
        ax += pull.ax * hold
        ay += pull.ay * hold
        ay -= params.physics.gravity * form.fold
        ax -= params.physics.windX * form.fold
        ay -= params.physics.windY * form.fold
        const curlMute = 1 - form.fold * 0.75
        ax -= curl.x * turb * (1 - curlMute)
        ay -= curl.y * turb * (1 - curlMute)
        onWire = pull.d
        if (form.fold > 0.35) this.life[i] = Math.min(this.maxLife[i], this.life[i] + adt * 0.35 * form.fold)
        this.energy[i] = clamp(this.energy[i] + (0.12 - pull.near * 0.06) * adt, 0, 2)
      }

      const inv = 1 / mass
      this.vx[i] += ax * inv * dt
      this.vy[i] += ay * inv * dt
      const damp = Math.pow(params.physics.damping, adt * 60)
      this.vx[i] *= damp
      this.vy[i] *= damp

      let maxV = params.swarm.maxSpeed * mood.speed
      if (form?.enabled && !launched) {
        maxV *= (0.38 + (1 - form.fold) * 0.45) * (1 + form.orbit * 0.7)
      }
      if (launched) maxV = Math.max(maxV, 520)
      if (onWire < 40 && (form?.orbit ?? 0) < 0.08 && !launched) maxV *= 0.55
      const sp = Math.hypot(this.vx[i], this.vy[i])
      if (sp > maxV) {
        this.vx[i] = (this.vx[i] / sp) * maxV
        this.vy[i] = (this.vy[i] / sp) * maxV
      }

      this.x[i] += this.vx[i] * dt
      this.y[i] += this.vy[i] * dt

      if (!launched && form?.enabled && form.attract > 0.02 && onWire < 42) {
        const t = this.shapes.target[i]
        const cling = Math.max(0, (form.attract / 2.4) * (1 - form.orbit * 0.55))
        const snap = form.fold * 0.12 * cling
        this.x[i] += (this.shapes.x[t] - this.x[i]) * snap
        this.y[i] += (this.shapes.y[t] - this.y[i]) * snap
        this.vx[i] *= 1 - form.fold * 0.28 * (1 - Math.min(0.7, form.orbit * 0.5))
        this.vy[i] *= 1 - form.fold * 0.28 * (1 - Math.min(0.7, form.orbit * 0.5))
      }

      this.applyEdge(i, params)

      this.life[i] -= adt * (kind === Kind.Spark ? 1.8 : 1)
      if (ts < 0) this.life[i] += adt * 1.6
    }

    this.collide(params, adt)
    this.frame++

    let w = 0
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) continue
      if (w !== i) this.copy(i, w)
      this.tint(w, params, Math.hypot(this.vx[w], this.vy[w]))
      w++
    }
    this.count = w

    for (let e = this.events.length - 1; e >= 0; e--) {
      this.events[e].age += adt
      if (this.events[e].age > 1.2) this.events.splice(e, 1)
    }
  }

  private applyEdge(i: number, params: SimParams): void {
    const mode = params.physics.edgeMode ?? EdgeMode.Wrap
    const w = this.width
    const h = this.height

    if (mode === EdgeMode.Wrap) {
      if (this.x[i] < 0) this.x[i] += w
      else if (this.x[i] > w) this.x[i] -= w
      if (this.y[i] < 0) this.y[i] += h
      else if (this.y[i] > h) this.y[i] -= h
      return
    }

    if (mode === EdgeMode.Leave) {
      const pad = 90
      if (this.x[i] < -pad || this.x[i] > w + pad || this.y[i] < -pad || this.y[i] > h + pad) {
        this.life[i] = 0
      }
      return
    }

    if (mode === EdgeMode.Fade) {
      const outside = this.x[i] < 0 || this.x[i] > w || this.y[i] < 0 || this.y[i] > h
      if (outside) {
        this.life[i] *= 0.82
        this.vx[i] *= 0.92
        this.vy[i] *= 0.92
        if (this.x[i] < -40 || this.x[i] > w + 40 || this.y[i] < -40 || this.y[i] > h + 40) {
          this.life[i] = 0
        }
      }
      return
    }

    const bounce = params.physics.wallBounce
    if (this.x[i] < 0) {
      this.x[i] = 0
      this.vx[i] *= -bounce
    } else if (this.x[i] > w) {
      this.x[i] = w
      this.vx[i] *= -bounce
    }
    if (this.y[i] < 0) {
      this.y[i] = 0
      this.vy[i] *= -bounce
    } else if (this.y[i] > h) {
      this.y[i] = h
      this.vy[i] *= -bounce
    }
  }

  private applySwarm(
    i: number,
    params: SimParams,
    mood: ReturnType<typeof moodMods>,
    pers: ReturnType<typeof personalityMods>,
    ax0: number,
    ay0: number,
    set: (ax: number, ay: number) => void,
  ): void {
    let ax = ax0
    let ay = ay0
    const n = this.hash.query(this.x[i], this.y[i], neighborBuf)
    const perc = params.swarm.perception
    const perc2 = perc * perc
    let sx = 0
    let sy = 0
    let sc = 0
    let axv = 0
    let ayv = 0
    let ac = 0
    let cx = 0
    let cy = 0
    let cc = 0
    let ox = 0
    let oy = 0
    let oc = 0
    let preyX = 0
    let preyY = 0
    let preyC = 0
    let predX = 0
    let predY = 0
    let predC = 0

    for (let k = 0; k < n; k++) {
      const j = neighborBuf[k]
      if (j === i) continue
      const dx = this.x[i] - this.x[j]
      const dy = this.y[i] - this.y[j]
      const d2 = dx * dx + dy * dy
      if (d2 > perc2 || d2 < 0.01) continue
      const d = Math.sqrt(d2)
      const same = this.swarm[i] === this.swarm[j]
      if (d < perc * 0.35) {
        sx += dx / d
        sy += dy / d
        sc++
      }
      if (same) {
        axv += this.vx[j]
        ayv += this.vy[j]
        ac++
        cx += this.x[j]
        cy += this.y[j]
        cc++
      } else {
        ox += dx / d
        oy += dy / d
        oc++
      }
      if (params.swarm.predatorPrey) {
        const hunter = this.swarm[i] === 1
        if (hunter && this.swarm[j] === 0) {
          preyX += this.x[j]
          preyY += this.y[j]
          preyC++
        } else if (!hunter && this.swarm[j] === 1) {
          predX += this.x[j]
          predY += this.y[j]
          predC++
        }
      }
    }

    const sep = params.swarm.separation * pers.sep * mood.sep
    const ali = params.swarm.alignment * pers.ali
    const coh = params.swarm.cohesion * pers.coh * mood.coh
    if (sc) {
      ax += (sx / sc) * sep * 320
      ay += (sy / sc) * sep * 320
    }
    if (ac) {
      ax += (axv / ac - this.vx[i]) * ali * 11
      ay += (ayv / ac - this.vy[i]) * ali * 11
    }
    if (cc) {
      const mx = cx / cc
      const my = cy / cc
      ax += (mx - this.x[i]) * coh * 4.2
      ay += (my - this.y[i]) * coh * 4.2
      const orbit = params.swarm.orbit ?? 0
      if (orbit > 0.02 || params.swarm.personality === 'vortex') {
        const o = (orbit + (params.swarm.personality === 'vortex' ? 0.7 : 0)) * 3.2
        ax += (this.y[i] - my) * o
        ay += (mx - this.x[i]) * o
      }
    }
    if (oc) {
      ax += (ox / oc) * params.swarm.avoidance * 210
      ay += (oy / oc) * params.swarm.avoidance * 210
    }
    if (preyC) {
      ax += (preyX / preyC - this.x[i]) * params.swarm.seek * 5.4
      ay += (preyY / preyC - this.y[i]) * params.swarm.seek * 5.4
    }
    if (predC) {
      ax -= (predX / predC - this.x[i]) * params.swarm.seek * 6.2
      ay -= (predY / predC - this.y[i]) * params.swarm.seek * 6.2
    }

    const pulseAmt = params.swarm.pulse ?? 0
    if (pulseAmt > 0.02 || params.swarm.personality === 'dancer') {
      const rate = params.swarm.personality === 'dancer' ? 7 : 3.4
      const pulse = Math.sin(this.time * rate + this.swarm[i] * 2) * (pulseAmt + (params.swarm.personality === 'dancer' ? 0.45 : 0))
      ax *= 1 + pulse * 0.22
      ay *= 1 + pulse * 0.22
      this.energy[i] = clamp(this.energy[i] + pulse * 0.03, 0, 2)
    }
    if (params.swarm.personality === 'storm') {
      ax += rand(-80, 80)
      ay += rand(-80, 80)
    }

    if (params.swarm.intelligence === Intelligence.Creative) {
      const ang = noise3(this.x[i] * 0.01, this.y[i] * 0.01, this.time * 0.15 + i * 0.01) * Math.PI * 2
      ax += Math.cos(ang) * 90 * pers.wander
      ay += Math.sin(ang) * 90 * pers.wander
      ax += (this.width * 0.5 - this.x[i]) * 0.22 * params.swarm.seek
      ay += (this.height * 0.5 - this.y[i]) * 0.22 * params.swarm.seek
      if (cc > 8 && Math.random() < 0.002) {
        this.energy[i] = 2
        this.geneC[i] += rand(-0.08, 0.08)
      }
    }

    set(ax, ay)
  }

  private collide(params: SimParams, dt: number): void {
    const r = params.physics.collisionRadius
    const r2 = r * r
    const rest = params.physics.collisionRestitution
    const inherit = params.creative.inheritOnCollision
    const mut = params.creative.mutationRate
    const exp = params.explosion
    const knall = exp?.enabled
    const threshold = exp?.threshold ?? 34
    let sparksLeft = 12
    let boomsLeft = knall ? 6 : 0

    for (let i = 0; i < this.count; i++) {
      if (this.boomCool[i] > 0) this.boomCool[i]--
    }

    for (let i = 0; i < this.count; i++) {
      const n = this.hash.query(this.x[i], this.y[i], neighborBuf)
      for (let k = 0; k < n; k++) {
        const j = neighborBuf[k]
        if (j <= i) continue
        const dx = this.x[j] - this.x[i]
        const dy = this.y[j] - this.y[i]
        const d2 = dx * dx + dy * dy
        if (d2 > r2 || d2 < 0.001) continue
        const d = Math.sqrt(d2)
        const nx = dx / d
        const ny = dy / d
        const overlap = (r - d) * 0.5
        this.x[i] -= nx * overlap
        this.y[i] -= ny * overlap
        this.x[j] += nx * overlap
        this.y[j] += ny * overlap
        const rvx = this.vx[j] - this.vx[i]
        const rvy = this.vy[j] - this.vy[i]
        const rel = rvx * nx + rvy * ny
        if (rel > 0) continue
        const imp = -(1 + rest) * rel * 0.5
        this.vx[i] -= imp * nx
        this.vy[i] -= imp * ny
        this.vx[j] += imp * nx
        this.vy[j] += imp * ny
        this.hits[i] = Math.min(255, this.hits[i] + 1)
        this.hits[j] = Math.min(255, this.hits[j] + 1)
        this.energy[i] = clamp(this.energy[i] + 0.12, 0, 2)
        this.energy[j] = clamp(this.energy[j] + 0.12, 0, 2)

        if (inherit) {
          const ga = (this.geneA[i] + this.geneA[j]) * 0.5
          const gb = (this.geneB[i] + this.geneB[j]) * 0.5
          const gc = (this.geneC[i] + this.geneC[j]) * 0.5
          this.geneA[i] = clamp(ga + rand(-mut, mut), 0.2, 1.8)
          this.geneA[j] = clamp(ga + rand(-mut, mut), 0.2, 1.8)
          this.geneB[i] = clamp(gb + rand(-mut, mut), 0.2, 1.8)
          this.geneB[j] = clamp(gb + rand(-mut, mut), 0.2, 1.8)
          this.geneC[i] = clamp(gc + rand(-mut, mut) * 0.35, -0.7, 0.7)
          this.geneC[j] = clamp(gc + rand(-mut, mut) * 0.35, -0.7, 0.7)
        }

        const impact = Math.abs(rel)
        const mx = (this.x[i] + this.x[j]) * 0.5
        const my = (this.y[i] + this.y[j]) * 0.5
        if (
          knall &&
          boomsLeft > 0 &&
          impact >= threshold &&
          this.boomCool[i] === 0 &&
          this.boomCool[j] === 0
        ) {
          boomsLeft--
          this.boomCool[i] = 12
          this.boomCool[j] = 12
          this.detonate(params, mx, my, impact)
          continue
        }

        if (sparksLeft > 0 && params.physics.secondarySparks > Math.random() && impact > 28) {
          sparksLeft--
          this.spawn(params, mx, my, -ny * 40 + rand(-20, 20), nx * 40 + rand(-20, 20), Kind.Spark, i)
        }
      }
    }
    void dt
  }

  private emitterSpawn(params: SimParams, dt: number): void {
    const items = emittersOf(params)
    const live = new Set(items.map((em) => em.id))
    for (const id of this.emitAcc.keys()) {
      if (!live.has(id)) this.emitAcc.delete(id)
    }
    for (const em of items) {
      if (!em.enabled || em.rate < 0.4) continue
      const next = (this.emitAcc.get(em.id) ?? 0) + em.rate * dt
      this.emitAcc.set(em.id, next)
      let acc = next
      const origin = emitterWorld(em, this.width, this.height)
      while (acc >= 1) {
        acc -= 1
        const kind = kindForMix(em.mix, () => pickKind(params))
        if (kind === -1) break
        const wobble = ((Math.random() - 0.5) * em.cone * Math.PI) / 180
        const rad = (em.heading * Math.PI) / 180 + wobble
        const fall = (22 + em.speed * 2.6) * rand(0.88, 1.1)
        const ox = origin.x + rand(-em.spread, em.spread)
        const oy = origin.y + rand(-em.spread, em.spread)
        const i = this.spawn(params, ox, oy, Math.cos(rad) * fall, Math.sin(rad) * fall, kind)
        if (i < 0) break
        this.launch[i] = 0.28 + em.speed * 0.00055
        if (em.mix !== EmitterMix.Field) {
          this.size[i] = Math.max(3.2, this.size[i] * 1.18)
          this.energy[i] = Math.max(this.energy[i], 1.05)
        }
        if (em.size !== 1) this.size[i] = Math.max(2, this.size[i] * em.size)
        if (em.life !== 1) {
          this.maxLife[i] *= em.life
          this.life[i] = this.maxLife[i]
        }
      }
      this.emitAcc.set(em.id, acc)
    }
  }

  private ambientSpawn(params: SimParams, dt: number): void {
    const rate = params.physics.spawnRate * dt
    this.spawnAcc += rate
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1
      const kind = pickKind(params)
      if (kind === -1) break
      const edge = Math.random()
      let x = rand(0, this.width)
      let y = rand(0, this.height)
      let vx = rand(-18, 18)
      let vy = rand(-22, 10)
      if (kind === Kind.Smoke || kind === Kind.Ember) {
        x = rand(this.width * 0.15, this.width * 0.85)
        y = this.height * (0.72 + Math.random() * 0.22)
        vy = rand(-50, -10)
      } else if (edge < 0.12) {
        x = Math.random() < 0.5 ? 0 : this.width
        vx = x === 0 ? rand(10, 40) : rand(-40, -10)
      }
      this.spawn(params, x, y, vx, vy, kind)
    }
  }

  private copy(from: number, to: number): void {
    this.x[to] = this.x[from]
    this.y[to] = this.y[from]
    this.vx[to] = this.vx[from]
    this.vy[to] = this.vy[from]
    this.life[to] = this.life[from]
    this.maxLife[to] = this.maxLife[from]
    this.size[to] = this.size[from]
    this.hue[to] = this.hue[from]
    this.sat[to] = this.sat[from]
    this.lit[to] = this.lit[from]
    this.energy[to] = this.energy[from]
    this.geneA[to] = this.geneA[from]
    this.geneB[to] = this.geneB[from]
    this.geneC[to] = this.geneC[from]
    this.kind[to] = this.kind[from]
    this.swarm[to] = this.swarm[from]
    this.hits[to] = this.hits[from]
    this.boomCool[to] = this.boomCool[from]
    this.slot[to] = this.slot[from]
    this.r[to] = this.r[from]
    this.g[to] = this.g[from]
    this.b[to] = this.b[from]
    this.a[to] = this.a[from]
    this.launch[to] = this.launch[from]
  }

  isAdditive(i: number): boolean {
    return ADDITIVE[this.kind[i]]
  }

  glowStrength(i: number): number {
    return KIND_GLOW[this.kind[i]] * (0.7 + this.energy[i] * 0.4)
  }
}
