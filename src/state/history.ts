import { cloneParams } from '../engine/params'
import type { SimParams } from '../engine/types'

export const HISTORY_LIMIT = 20

export type HistorySnap = {
  params: SimParams
  behaviorPresetId: string | null
  colorPresetId: string | null
  explosionPresetId: string | null
  shapePresetId: string | null
  mixPresetId: string | null
}

export type HistoryIds = Omit<HistorySnap, 'params'>

export function captureSnap(s: HistorySnap): HistorySnap {
  return {
    params: cloneParams(s.params),
    behaviorPresetId: s.behaviorPresetId,
    colorPresetId: s.colorPresetId,
    explosionPresetId: s.explosionPresetId,
    shapePresetId: s.shapePresetId,
    mixPresetId: s.mixPresetId,
  }
}

let coalesceKey: string | null = null
let coalesceTimer: ReturnType<typeof setTimeout> | null = null

export function endCoalesce(): void {
  coalesceKey = null
  if (coalesceTimer) {
    clearTimeout(coalesceTimer)
    coalesceTimer = null
  }
}

/** Returns true when this change starts a new undo step. */
export function beginCoalesce(key: string): boolean {
  const fresh = coalesceKey !== key
  coalesceKey = key
  if (coalesceTimer) clearTimeout(coalesceTimer)
  coalesceTimer = setTimeout(() => {
    coalesceKey = null
    coalesceTimer = null
  }, 380)
  return fresh
}

export function pushPast(past: HistorySnap[], current: HistorySnap): HistorySnap[] {
  return [...past, captureSnap(current)].slice(-HISTORY_LIMIT)
}
