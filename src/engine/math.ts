export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

export function rand(min = 0, max = 1): number {
  return min + Math.random() * (max - min)
}

export function randSign(): number {
  return Math.random() < 0.5 ? -1 : 1
}

export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  const n = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw
  const v = Number.parseInt(n, 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return [h, s, l]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 1) + 1) % 1
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const t = [hue + 1 / 3, hue, hue - 1 / 3]
  const out = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    let tc = t[i]
    if (tc < 0) tc += 1
    if (tc > 1) tc -= 1
    if (tc < 1 / 6) out[i] = p + (q - p) * 6 * tc
    else if (tc < 1 / 2) out[i] = q
    else if (tc < 2 / 3) out[i] = p + (q - p) * (2 / 3 - tc) * 6
    else out[i] = p
  }
  return [Math.round(out[0] * 255), Math.round(out[1] * 255), Math.round(out[2] * 255)]
}

export function mixRgb3(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
  t: number,
): [number, number, number] {
  const x = clamp(t, 0, 1)
  if (x < 0.5) {
    const u = x * 2
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]
  }
  const u = (x - 0.5) * 2
  return [lerp(b[0], c[0], u), lerp(b[1], c[1], u), lerp(b[2], c[2], u)]
}

/** Sample the 3-stop palette in RGB, then apply a global hue rotate plus sat/brightness. */
export function paletteSample(
  primary: [number, number, number],
  secondary: [number, number, number],
  accent: [number, number, number],
  t: number,
  hueShift: number,
  saturation: number,
  brightness: number,
): [number, number, number] {
  const mixed = mixRgb3(primary, secondary, accent, t)
  const [h, s, l] = rgbToHsl(mixed[0], mixed[1], mixed[2])
  return hslToRgb(h + hueShift / 360, clamp(s * saturation, 0, 1), clamp(l * brightness, 0.08, 0.96))
}

const PERM = new Uint8Array(512)
for (let i = 0; i < 256; i++) PERM[i] = i
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  const tmp = PERM[i]
  PERM[i] = PERM[j]
  PERM[j] = tmp
}
for (let i = 0; i < 256; i++) PERM[i + 256] = PERM[i]

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

export function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const zf = z - Math.floor(z)
  const u = fade(xf)
  const v = fade(yf)
  const w = fade(zf)
  const A = PERM[X] + Y
  const AA = PERM[A] + Z
  const AB = PERM[A + 1] + Z
  const B = PERM[X + 1] + Y
  const BA = PERM[B] + Z
  const BB = PERM[B + 1] + Z
  return lerp(
    lerp(
      lerp(grad(PERM[AA], xf, yf, zf), grad(PERM[BA], xf - 1, yf, zf), u),
      lerp(grad(PERM[AB], xf, yf - 1, zf), grad(PERM[BB], xf - 1, yf - 1, zf), u),
      v,
    ),
    lerp(
      lerp(grad(PERM[AA + 1], xf, yf, zf - 1), grad(PERM[BA + 1], xf - 1, yf, zf - 1), u),
      lerp(grad(PERM[AB + 1], xf, yf - 1, zf - 1), grad(PERM[BB + 1], xf - 1, yf - 1, zf - 1), u),
      v,
    ),
    w,
  )
}

export function curlNoise(
  x: number,
  y: number,
  t: number,
  scale: number,
): { x: number; y: number } {
  const e = 0.75
  const n1 = noise3(x * scale, (y + e) * scale, t)
  const n2 = noise3(x * scale, (y - e) * scale, t)
  const n3 = noise3((x + e) * scale, y * scale, t)
  const n4 = noise3((x - e) * scale, y * scale, t)
  return {
    x: (n1 - n2) / (2 * e),
    y: (n4 - n3) / (2 * e),
  }
}

export class SpatialHash {
  private cells = new Map<number, number[]>()
  cellSize: number

  constructor(cellSize: number) {
    this.cellSize = Math.max(8, cellSize)
  }

  clear(): void {
    this.cells.clear()
  }

  key(x: number, y: number): number {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    return ((cx + 4096) << 16) | ((cy + 4096) & 0xffff)
  }

  insert(i: number, x: number, y: number): void {
    const k = this.key(x, y)
    const list = this.cells.get(k)
    if (list) list.push(i)
    else this.cells.set(k, [i])
  }

  query(x: number, y: number, out: number[]): number {
    return this.queryRange(x, y, this.cellSize, out)
  }

  queryRange(x: number, y: number, radius: number, out: number[]): number {
    const reach = Math.max(1, Math.ceil(radius / this.cellSize))
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    let n = 0
    const cap = out.length
    for (let iy = -reach; iy <= reach; iy++) {
      for (let ix = -reach; ix <= reach; ix++) {
        const k = ((cx + ix + 4096) << 16) | ((cy + iy + 4096) & 0xffff)
        const list = this.cells.get(k)
        if (!list) continue
        for (let j = 0; j < list.length; j++) {
          if (n >= cap) return n
          out[n++] = list[j]
        }
      }
    }
    return n
  }
}
