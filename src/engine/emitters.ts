import { Kind, type Emitter, type EmitterMixId, type KindId, type SimParams } from './types'
import { EmitterMix } from './types'

export const MAX_EMITTERS = 8
export const EMITTER_HIT = 22

export const DEFAULT_EMITTER: Omit<Emitter, 'id' | 'nx' | 'ny'> = {
  enabled: true,
  rate: 48,
  heading: -90,
  cone: 36,
  speed: 160,
  spread: 16,
  size: 1,
  life: 1,
  mix: EmitterMix.Field,
}

let seq = 0

export function createEmitter(nx: number, ny: number): Emitter {
  seq += 1
  return {
    ...DEFAULT_EMITTER,
    id: `em-${seq.toString(36)}-${Math.floor(Math.random() * 1e5).toString(36)}`,
    nx: clamp01(nx),
    ny: clamp01(ny),
  }
}

export function emittersOf(params: SimParams): Emitter[] {
  return params.emitters?.items ?? []
}

export function emitterWorld(em: Emitter, width: number, height: number): { x: number; y: number } {
  return { x: em.nx * width, y: em.ny * height }
}

export function hitEmitter(
  items: Emitter[],
  x: number,
  y: number,
  width: number,
  height: number,
  radius = EMITTER_HIT,
): Emitter | null {
  let best: Emitter | null = null
  let bestD = radius * radius
  for (const em of items) {
    const p = emitterWorld(em, width, height)
    const dx = p.x - x
    const dy = p.y - y
    const d = dx * dx + dy * dy
    if (d <= bestD) {
      bestD = d
      best = em
    }
  }
  return best
}

export function kindForMix(mix: EmitterMixId, pickField: () => KindId | -1): KindId | -1 {
  if (mix === EmitterMix.Field) return pickField()
  if (mix === EmitterMix.Smoke) return Kind.Smoke
  if (mix === EmitterMix.Embers) return Kind.Ember
  if (mix === EmitterMix.Sparks) return Kind.Spark
  if (mix === EmitterMix.Dust) return Kind.Dust
  if (mix === EmitterMix.Energy) return Kind.Energy
  return Kind.Blob
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}
