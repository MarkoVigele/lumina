import type { ShapeId, ShapeParams, SimParams } from './types'
import { Shape } from './types'
import { clamp } from './math'

export const SHAPE_ORDER: ShapeId[] = [
  Shape.Cube,
  Shape.Tetra,
  Shape.Octa,
  Shape.Pyramid,
  Shape.Diamond,
  Shape.Icosa,
  Shape.Sphere,
  Shape.Torus,
  Shape.Star,
  Shape.Helix,
  Shape.Prism,
]

export const SHAPE_LABEL: Record<ShapeId, string> = {
  cube: 'Würfel',
  tetra: 'Tetraeder',
  octa: 'Oktaeder',
  pyramid: 'Pyramide',
  diamond: 'Diamant',
  icosa: 'Ikosaeder',
  sphere: 'Kugel',
  torus: 'Torus',
  star: 'Stern',
  helix: 'Helix',
  prism: 'Prisma',
}

type Vec3 = [number, number, number]
type Edge = [Vec3, Vec3]

function v(x: number, y: number, z: number): Vec3 {
  return [x, y, z]
}

function edgesFrom(verts: Vec3[], pairs: [number, number][]): Edge[] {
  return pairs.map(([a, b]) => [verts[a], verts[b]])
}

function ring(count: number, y: number, radius: number): Vec3[] {
  const out: Vec3[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    out.push(v(Math.cos(a) * radius, y, Math.sin(a) * radius))
  }
  return out
}

function meshCube(): Edge[] {
  const s = 0.72
  const verts: Vec3[] = [
    v(-s, -s, -s), v(s, -s, -s), v(s, s, -s), v(-s, s, -s),
    v(-s, -s, s), v(s, -s, s), v(s, s, s), v(-s, s, s),
  ]
  return edgesFrom(verts, [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ])
}

function meshTetra(): Edge[] {
  const a = 0.85
  const verts: Vec3[] = [
    v(a, a, a), v(a, -a, -a), v(-a, a, -a), v(-a, -a, a),
  ]
  return edgesFrom(verts, [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
  ])
}

function meshOcta(): Edge[] {
  const s = 0.95
  const verts: Vec3[] = [
    v(s, 0, 0), v(-s, 0, 0), v(0, s, 0), v(0, -s, 0), v(0, 0, s), v(0, 0, -s),
  ]
  return edgesFrom(verts, [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [2, 5], [3, 4], [3, 5],
  ])
}

function meshPyramid(): Edge[] {
  const s = 0.78
  const verts: Vec3[] = [
    v(-s, -s, -s), v(s, -s, -s), v(s, -s, s), v(-s, -s, s), v(0, 0.92, 0),
  ]
  return edgesFrom(verts, [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [0, 4], [1, 4], [2, 4], [3, 4],
  ])
}

function meshDiamond(): Edge[] {
  const verts: Vec3[] = [
    v(0.7, 0, 0), v(-0.7, 0, 0), v(0, 1.05, 0), v(0, -1.05, 0), v(0, 0, 0.7), v(0, 0, -0.7),
  ]
  return edgesFrom(verts, [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [2, 5], [3, 4], [3, 5],
  ])
}

function meshIcosa(): Edge[] {
  const t = (1 + Math.sqrt(5)) / 2
  const n = 1 / Math.hypot(1, t)
  const verts: Vec3[] = [
    v(-1, t, 0), v(1, t, 0), v(-1, -t, 0), v(1, -t, 0),
    v(0, -1, t), v(0, 1, t), v(0, -1, -t), v(0, 1, -t),
    v(t, 0, -1), v(t, 0, 1), v(-t, 0, -1), v(-t, 0, 1),
  ].map(([x, y, z]) => v(x * n * 0.95, y * n * 0.95, z * n * 0.95))
  return edgesFrom(verts, [
    [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 8], [1, 9],
    [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 5], [4, 9], [4, 11],
    [5, 9], [5, 11],
    [6, 7], [6, 8], [6, 10],
    [7, 8], [7, 10],
    [8, 9],
    [10, 11],
  ])
}

function meshSphere(): Edge[] {
  const edges: Edge[] = []
  const lats = 5
  const lons = 8
  for (let i = 1; i < lats; i++) {
    const y = -0.85 + (1.7 * i) / lats
    const r = Math.sqrt(Math.max(0, 0.85 * 0.85 - y * y))
    const ringA = ring(lons, y, r)
    for (let k = 0; k < lons; k++) edges.push([ringA[k], ringA[(k + 1) % lons]])
  }
  for (let k = 0; k < lons; k++) {
    const a = (k / lons) * Math.PI * 2
    const mer: Vec3[] = []
    for (let i = 0; i <= lats; i++) {
      const t = i / lats
      const y = -0.85 + 1.7 * t
      const r = Math.sqrt(Math.max(0, 0.85 * 0.85 - y * y))
      mer.push(v(Math.cos(a) * r, y, Math.sin(a) * r))
    }
    for (let i = 0; i < mer.length - 1; i++) edges.push([mer[i], mer[i + 1]])
  }
  return edges
}

function meshTorus(): Edge[] {
  const edges: Edge[] = []
  const R = 0.68
  const r = 0.26
  const major = 10
  const minor = 6
  const point = (i: number, j: number): Vec3 => {
    const u = (i / major) * Math.PI * 2
    const vang = (j / minor) * Math.PI * 2
    const cx = Math.cos(u) * R
    const cz = Math.sin(u) * R
    return v(cx + Math.cos(u) * Math.cos(vang) * r, Math.sin(vang) * r, cz + Math.sin(u) * Math.cos(vang) * r)
  }
  for (let i = 0; i < major; i++) {
    for (let j = 0; j < minor; j++) {
      edges.push([point(i, j), point(i, j + 1)])
      edges.push([point(i, j), point(i + 1, j)])
    }
  }
  return edges
}

function meshStar(): Edge[] {
  const outer = 0.95
  const inner = 0.38
  const spikes = 5
  const top: Vec3[] = []
  const bot: Vec3[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    top.push(v(Math.cos(a) * r, 0.22, Math.sin(a) * r))
    bot.push(v(Math.cos(a) * r * 0.7, -0.22, Math.sin(a) * r * 0.7))
  }
  const edges: Edge[] = []
  for (let i = 0; i < top.length; i++) {
    edges.push([top[i], top[(i + 1) % top.length]])
    edges.push([bot[i], bot[(i + 1) % bot.length]])
    edges.push([top[i], bot[i]])
  }
  return edges
}

function meshHelix(): Edge[] {
  const edges: Edge[] = []
  const turns = 3
  const steps = 28
  const build = (phase: number) => {
    const pts: Vec3[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = t * turns * Math.PI * 2 + phase
      pts.push(v(Math.cos(a) * 0.62, -0.9 + t * 1.8, Math.sin(a) * 0.62))
    }
    for (let i = 0; i < pts.length - 1; i++) edges.push([pts[i], pts[i + 1]])
  }
  build(0)
  build(Math.PI)
  return edges
}

function meshPrism(): Edge[] {
  const n = 6
  const top = ring(n, 0.72, 0.62)
  const bot = ring(n, -0.72, 0.62)
  const edges: Edge[] = []
  for (let i = 0; i < n; i++) {
    edges.push([top[i], top[(i + 1) % n]])
    edges.push([bot[i], bot[(i + 1) % n]])
    edges.push([top[i], bot[i]])
  }
  return edges
}

const MESH: Record<ShapeId, Edge[]> = {
  cube: meshCube(),
  tetra: meshTetra(),
  octa: meshOcta(),
  pyramid: meshPyramid(),
  diamond: meshDiamond(),
  icosa: meshIcosa(),
  sphere: meshSphere(),
  torus: meshTorus(),
  star: meshStar(),
  helix: meshHelix(),
  prism: meshPrism(),
}

const SAMPLE_N = 128

function sampleMesh(id: ShapeId, out: Float32Array): void {
  const edges = MESH[id] ?? MESH.cube
  let total = 0
  const lens: number[] = []
  for (const [a, b] of edges) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 0.001
    lens.push(len)
    total += len
  }
  let written = 0
  for (let e = 0; e < edges.length; e++) {
    const share = Math.max(1, Math.round((lens[e] / total) * SAMPLE_N))
    const [a, b] = edges[e]
    const count = e === edges.length - 1 ? SAMPLE_N - written : Math.min(share, SAMPLE_N - written)
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / count
      const o = (written + i) * 3
      out[o] = a[0] + (b[0] - a[0]) * t
      out[o + 1] = a[1] + (b[1] - a[1]) * t
      out[o + 2] = a[2] + (b[2] - a[2]) * t
    }
    written += count
    if (written >= SAMPLE_N) break
  }
  while (written < SAMPLE_N) {
    const o = written * 3
    out[o] = out[o - 3] ?? 0
    out[o + 1] = out[o - 2] ?? 0
    out[o + 2] = out[o - 1] ?? 0
    written++
  }
}

function rotX(x: number, y: number, z: number, c: number, s: number): Vec3 {
  return [x, y * c - z * s, y * s + z * c]
}
function rotY(x: number, y: number, z: number, c: number, s: number): Vec3 {
  return [x * c + z * s, y, -x * s + z * c]
}
function rotZ(x: number, y: number, z: number, c: number, s: number): Vec3 {
  return [x * c - y * s, x * s + y * c, z]
}

export class ShapeField {
  n = SAMPLE_N
  x = new Float32Array(SAMPLE_N)
  y = new Float32Array(SAMPLE_N)
  z = new Float32Array(SAMPLE_N)
  lines: { x1: number; y1: number; x2: number; y2: number; z: number }[] = []

  private from = new Float32Array(SAMPLE_N * 3)
  private to = new Float32Array(SAMPLE_N * 3)
  private fromId: ShapeId = Shape.Cube
  private toId: ShapeId = Shape.Cube
  private blend = 1
  private hold = 0
  private spinning = 0
  private primed = false
  private lastChip: ShapeId | null = null
  cycledTo: ShapeId | null = null

  tick(params: SimParams, dt: number, width: number, height: number, time: number): void {
    const p = params.shape
    this.cycledTo = null
    if (!p?.enabled) {
      this.lines.length = 0
      return
    }
    this.beginFrame()

    if (!this.primed) {
      sampleMesh(p.shape, this.from)
      sampleMesh(p.shape, this.to)
      this.fromId = p.shape
      this.toId = p.shape
      this.blend = 1
      this.primed = true
      this.lastChip = p.shape
    }

    const chipChanged = this.lastChip !== null && p.shape !== this.lastChip
    this.lastChip = p.shape

    if (chipChanged && p.shape !== this.toId) {
      this.from.set(this.to)
      this.fromId = this.toId
      sampleMesh(p.shape, this.to)
      this.toId = p.shape
      this.blend = 0
      this.hold = 0
    } else if (!p.autoCycle && p.shape !== this.toId && this.blend >= 1) {
      this.from.set(this.to)
      this.fromId = this.toId
      sampleMesh(p.shape, this.to)
      this.toId = p.shape
      this.blend = 0
      this.hold = 0
    }

    if (p.autoCycle && this.blend >= 1) {
      this.hold += dt
      if (this.hold >= Math.max(0.4, p.switchHold)) {
        const next = this.nextShape(p)
        this.from.set(this.to)
        this.fromId = this.toId
        sampleMesh(next, this.to)
        this.toId = next
        this.blend = 0
        this.hold = 0
        this.cycledTo = next
      }
    }

    if (this.blend < 1) {
      const dur = Math.max(0.12, p.switchSpeed)
      this.blend = Math.min(1, this.blend + dt / dur)
    }

    this.spinning += dt
    const pulse = 1 + Math.sin(time * (0.7 + p.pulse * 2.2)) * p.pulse * 0.16
    const scale = Math.max(40, p.scale) * pulse
    const persp = 1.6 + p.perspective * 2.4
    const yaw = this.spinning * p.spinY + time * 0.04
    const pitch = this.spinning * p.spinX + Math.sin(time * 0.33) * p.wander * 0.35
    const roll = this.spinning * p.spinZ
    const cx = width * 0.5 + Math.sin(time * 0.31) * p.drift * 90
    const cy = height * 0.5 + Math.cos(time * 0.24) * p.wander * 70
    const u = this.blend * this.blend * (3 - 2 * this.blend)
    const cyaw = Math.cos(yaw)
    const syaw = Math.sin(yaw)
    const cp = Math.cos(pitch)
    const sp = Math.sin(pitch)
    const cr = Math.cos(roll)
    const sr = Math.sin(roll)

    for (let i = 0; i < SAMPLE_N; i++) {
      const o = i * 3
      let x = this.from[o] + (this.to[o] - this.from[o]) * u
      let y = this.from[o + 1] + (this.to[o + 1] - this.from[o + 1]) * u
      let z = this.from[o + 2] + (this.to[o + 2] - this.from[o + 2]) * u
      ;[x, y, z] = rotX(x, y, z, cp, sp)
      ;[x, y, z] = rotY(x, y, z, cyaw, syaw)
      ;[x, y, z] = rotZ(x, y, z, cr, sr)
      const depth = persp / (persp + z)
      this.x[i] = cx + x * scale * depth
      this.y[i] = cy - y * scale * depth
      this.z[i] = z
    }

    this.drawRealEdges(p, scale, persp, cx, cy, u, cp, sp, cyaw, syaw, cr, sr)
  }

  private drawRealEdges(
    p: ShapeParams,
    scale: number,
    persp: number,
    cx: number,
    cy: number,
    u: number,
    cp: number,
    sp: number,
    cyaw: number,
    syaw: number,
    cr: number,
    sr: number,
  ): void {
    if (p.ghost < 0.02) {
      this.lines.length = 0
      return
    }
    const edges = MESH[this.toId] ?? MESH.cube
    this.lines.length = 0
    const project = (pt: Vec3) => {
      let x = pt[0]
      let y = pt[1]
      let z = pt[2]
      ;[x, y, z] = rotX(x, y, z, cp, sp)
      ;[x, y, z] = rotY(x, y, z, cyaw, syaw)
      ;[x, y, z] = rotZ(x, y, z, cr, sr)
      const depth = persp / (persp + z)
      return { x: cx + x * scale * depth, y: cy - y * scale * depth, z }
    }
    if (this.blend < 0.999) {
      const fromEdges = MESH[this.fromId] ?? MESH.cube
      const toEdges = MESH[this.toId] ?? MESH.cube
      const count = Math.min(fromEdges.length, toEdges.length)
      for (let i = 0; i < count; i++) {
        const a0 = fromEdges[i][0]
        const a1 = fromEdges[i][1]
        const b0 = toEdges[i][0]
        const b1 = toEdges[i][1]
        const p0 = project([
          a0[0] + (b0[0] - a0[0]) * u,
          a0[1] + (b0[1] - a0[1]) * u,
          a0[2] + (b0[2] - a0[2]) * u,
        ])
        const p1 = project([
          a1[0] + (b1[0] - a1[0]) * u,
          a1[1] + (b1[1] - a1[1]) * u,
          a1[2] + (b1[2] - a1[2]) * u,
        ])
        this.lines.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, z: (p0.z + p1.z) * 0.5 })
      }
      return
    }
    for (const [a, b] of edges) {
      const p0 = project(a)
      const p1 = project(b)
      this.lines.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, z: (p0.z + p1.z) * 0.5 })
    }
  }

  private nextShape(p: ShapeParams): ShapeId {
    if (p.randomOrder) {
      let pick = SHAPE_ORDER[Math.floor(Math.random() * SHAPE_ORDER.length)]
      if (pick === this.toId) pick = SHAPE_ORDER[(SHAPE_ORDER.indexOf(this.toId) + 1) % SHAPE_ORDER.length]
      return pick
    }
    const i = SHAPE_ORDER.indexOf(this.toId)
    return SHAPE_ORDER[(i + 1) % SHAPE_ORDER.length]
  }

  target = new Uint16Array(8000)
  private occ = new Uint16Array(SAMPLE_N)
  private occNext = new Uint16Array(SAMPLE_N)

  beginFrame(): void {
    this.occ.set(this.occNext)
    this.occNext.fill(0)
  }

  pull(i: number, px: number, py: number, params: ShapeParams): { ax: number; ay: number; near: number; tx: number; ty: number; d: number } {
    const n = this.n
    const xs = this.x
    const ys = this.y
    let best = this.target[i] < n ? this.target[i] : i % n
    let bestD = (xs[best] - px) * (xs[best] - px) + (ys[best] - py) * (ys[best] - py)
    for (let k = 0; k < n; k++) {
      const dxk = xs[k] - px
      const dyk = ys[k] - py
      const d2 = dxk * dxk + dyk * dyk
      if (d2 < bestD) {
        bestD = d2
        best = k
      }
    }
    this.target[i] = best
    this.occNext[best]++

    const tx = xs[best]
    const ty = ys[best]
    const dx = tx - px
    const dy = ty - py
    const d = Math.sqrt(bestD)
    const attract = Math.max(0, params.attract)
    const fold = params.fold
    const feel = (attract * attract) / 3.2
    const spring = feel * (12 + fold * 18)
    let ax = dx * spring
    let ay = dy * spring

    const left = (best + n - 1) % n
    const right = (best + 1) % n
    if (d < 56) {
      let slide = best
      if (this.occ[best] > this.occ[right] + 1) slide = right
      else if (this.occ[best] > this.occ[left] + 1) slide = left
      ax += (xs[slide] - px) * feel * 9
      ay += (ys[slide] - py) * feel * 9
      const ex = xs[right] - xs[left]
      const ey = ys[right] - ys[left]
      ax += ex * attract * 0.85
      ay += ey * attract * 0.85
    }

    const orbit = params.orbit
    if (orbit > 0.01 && d < 140) {
      const cling = 1 - Math.min(0.62, orbit * 0.32)
      ax *= cling
      ay *= cling
      const fall = d < 8 ? 1 : Math.min(1, 88 / d)
      const tang = orbit * (26 + attract * 12) * fall
      ax += -dy * tang
      ay += dx * tang
    }

    const depth = clamp(0.55 + this.z[best] * params.depthFade * 0.35, 0.35, 1.2)
    return { ax: ax * depth, ay: ay * depth, near: this.z[best], tx, ty, d }
  }
}
