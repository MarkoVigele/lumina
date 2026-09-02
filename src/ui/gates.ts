import { kiDrives, TimeMode } from '../engine/types'
import type { ShapeParams, SwarmParams, CreativeParams, GraphicsParams } from '../engine/types'

export const HINT = {
  formField: 'wird von Form verwaltet — Form aus oder Falten senken',
  formOff: 'Form ist aus — Körper an',
  formCycle: 'nur bei Selbst wechseln',
  formOrbit: 'Zug ist zu niedrig — anheben',
  knallOff: 'Explosion ist aus — einschalten oder eine Vorlage wählen',
  kiOff: 'KI ist aus — Schwarm oder Agenten wählen',
  kiStrength: 'KI-Stärke ist 0 — anheben',
  kiForm: 'wird von Form gedämpft — Falten senken für volle Wirkung',
  freeze: 'Standbild ist an — Zeitmodus ändern',
  kaleido: 'Symmetrie auf 2 oder höher stellen',
  trails: 'Spuren einschalten',
  post: 'Nachbearbeitung einschalten',
} as const

/** Form cancels gravity, wind and most turbulence. */
export function formOwnsField(form: ShapeParams): boolean {
  return form.enabled && form.attract > 0.02 && form.fold > 0.55
}

export function formDampsKi(form: ShapeParams): boolean {
  return form.enabled && form.fold > 0.55
}

export function formPulls(form: ShapeParams): boolean {
  return form.enabled && form.attract > 0.02
}

export function kiLockHint(swarm: SwarmParams): string | undefined {
  if (!kiDrives(swarm.intelligence)) return HINT.kiOff
  if ((swarm.strength ?? 1) < 0.04) return HINT.kiStrength
  return undefined
}

export function kiHint(swarm: SwarmParams, form: ShapeParams): string | undefined {
  return kiLockHint(swarm) ?? (formDampsKi(form) ? HINT.kiForm : undefined)
}

export function kiLocked(swarm: SwarmParams): boolean {
  return kiLockHint(swarm) !== undefined
}

export function timeScaleHint(creative: CreativeParams): string | undefined {
  return creative.timeMode === TimeMode.Freeze ? HINT.freeze : undefined
}

export function kaleidoHint(creative: CreativeParams): string | undefined {
  return creative.symmetry <= 1 ? HINT.kaleido : undefined
}

export function trailHint(graphics: GraphicsParams): string | undefined {
  return graphics.trails ? undefined : HINT.trails
}

export function chromaHint(graphics: GraphicsParams): string | undefined {
  return graphics.postEffects ? undefined : HINT.post
}

/** Display-chip id. Simulation timestep never reads this. */
export function displayFpsMode(graphics: GraphicsParams): '30' | '60' | '120' | 'auto' {
  if (graphics.vsync) return 'auto'
  if (graphics.fpsLimit === 30) return '30'
  if (graphics.fpsLimit === 120) return '120'
  return '60'
}
