import type { FullSnapshot, SimParams } from '../engine/types'
import { cloneParams, DEFAULT_PARAMS, mergeParams } from '../engine/params'

const KEY = 'lumina.saves.v1'
const AUTO_KEY = 'lumina.autosave.v1'
const SLOT_COUNT = 8

export type SaveSlot = {
  id: number
  snapshot: FullSnapshot | null
}

export function emptySlots(): SaveSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, id) => ({ id, snapshot: null }))
}

export function loadSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySlots()
    const parsed = JSON.parse(raw) as SaveSlot[]
    const slots = emptySlots()
    for (const item of parsed) {
      if (item && item.id >= 0 && item.id < SLOT_COUNT) slots[item.id] = item
    }
    return slots
  } catch {
    return emptySlots()
  }
}

export function persistSlots(slots: SaveSlot[]): void {
  localStorage.setItem(KEY, JSON.stringify(slots))
}

export function makeSnapshot(
  name: string,
  params: SimParams,
  behaviorPresetId: string | null,
  colorPresetId: string | null,
  favorite = false,
): FullSnapshot {
  return {
    version: 1,
    name,
    favorite,
    savedAt: new Date().toISOString(),
    params: cloneParams(params),
    behaviorPresetId,
    colorPresetId,
  }
}

export function writeSlot(slots: SaveSlot[], id: number, snapshot: FullSnapshot): SaveSlot[] {
  const next = slots.map((s) => (s.id === id ? { ...s, snapshot } : s))
  persistSlots(next)
  return next
}

export function clearSlot(slots: SaveSlot[], id: number): SaveSlot[] {
  const next = slots.map((s) => (s.id === id ? { ...s, snapshot: null } : s))
  persistSlots(next)
  return next
}

export function toggleFavorite(slots: SaveSlot[], id: number): SaveSlot[] {
  const next = slots.map((s) => {
    if (s.id !== id || !s.snapshot) return s
    return { ...s, snapshot: { ...s.snapshot, favorite: !s.snapshot.favorite } }
  })
  persistSlots(next)
  return next
}

export function writeAutosave(snapshot: FullSnapshot): void {
  localStorage.setItem(AUTO_KEY, JSON.stringify(snapshot))
}

export function readAutosave(): FullSnapshot | null {
  try {
    const raw = localStorage.getItem(AUTO_KEY)
    return raw ? (JSON.parse(raw) as FullSnapshot) : null
  } catch {
    return null
  }
}

export function exportSnapshot(snapshot: FullSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}

export function importSnapshot(text: string): FullSnapshot {
  const data = JSON.parse(text) as FullSnapshot
  if (!data || data.version !== 1 || !data.params) {
    throw new Error('Ungültige Lumina-Datei')
  }
  return {
    ...data,
    params: mergeParams(DEFAULT_PARAMS, data.params),
  }
}
