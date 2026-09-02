import { create } from 'zustand'
import {
  applyQuality,
  cloneParams,
  DEFAULT_PARAMS,
  mergeParams,
} from '../engine/params'
import type { Emitter, SectionKey, SimParams } from '../engine/types'
import { createEmitter, emittersOf, MAX_EMITTERS } from '../engine/emitters'
import {
  applyScenePreset,
  applyColorPreset,
  applyExplosionPreset,
  applyMixPreset,
  applyShapePreset,
  paletteIdOfScene,
  randomizeParams,
} from './presets'
import {
  beginCoalesce,
  captureSnap,
  endCoalesce,
  HISTORY_LIMIT,
  pushPast,
  type HistorySnap,
} from './history'
import {
  clearSlot,
  loadSlots,
  makeSnapshot,
  readAutosave,
  toggleFavorite,
  type SaveSlot,
  writeAutosave,
  writeSlot,
} from './saves'

export type HistoryOpts = { silent?: boolean }

type Store = {
  params: SimParams
  behaviorPresetId: string | null
  colorPresetId: string | null
  explosionPresetId: string | null
  shapePresetId: string | null
  mixPresetId: string | null
  past: HistorySnap[]
  future: HistorySnap[]
  slots: SaveSlot[]
  panelOpen: boolean
  hints: boolean
  recording: boolean
  panelTab: string
  selectedEmitterId: string | null
  placeMode: boolean
  setSection: <K extends SectionKey>(key: K, patch: Partial<SimParams[K]>, opts?: HistoryOpts) => void
  setPanelTab: (tab: string) => void
  setPlaceMode: (on: boolean) => void
  selectEmitter: (id: string | null) => void
  addEmitter: (nx: number, ny: number) => string | null
  removeEmitter: (id: string) => void
  patchEmitter: (id: string, patch: Partial<Emitter>, opts?: HistoryOpts & { field?: string }) => void
  resetSection: (key: SectionKey) => void
  resetAll: () => void
  applyBehavior: (id: string, opts?: HistoryOpts) => void
  applyColor: (id: string, opts?: HistoryOpts) => void
  applyExplosion: (id: string) => void
  applyShape: (id: string) => void
  applyMix: (id: string) => void
  setQuality: (quality: SimParams['graphics']['quality']) => void
  randomize: () => void
  undo: () => void
  redo: () => void
  setPanelOpen: (open: boolean) => void
  setHints: (on: boolean) => void
  setRecording: (on: boolean) => void
  saveToSlot: (id: number, name?: string) => void
  loadSlot: (id: number) => void
  deleteSlot: (id: number) => void
  favoriteSlot: (id: number) => void
  saveAsNew: (name: string) => void
  loadSnapshotParams: (params: SimParams, behavior: string | null, color: string | null) => void
  autosave: () => void
  restoreAutosave: () => boolean
}

function liveSnap(s: Pick<Store, keyof HistorySnap>): HistorySnap {
  return {
    params: s.params,
    behaviorPresetId: s.behaviorPresetId,
    colorPresetId: s.colorPresetId,
    explosionPresetId: s.explosionPresetId,
    shapePresetId: s.shapePresetId,
    mixPresetId: s.mixPresetId,
  }
}

function restore(snap: HistorySnap) {
  return {
    params: cloneParams(snap.params),
    behaviorPresetId: snap.behaviorPresetId,
    colorPresetId: snap.colorPresetId,
    explosionPresetId: snap.explosionPresetId,
    shapePresetId: snap.shapePresetId,
    mixPresetId: snap.mixPresetId,
  }
}

export const useLumina = create<Store>((set, get) => ({
  params: cloneParams(DEFAULT_PARAMS),
  behaviorPresetId: 'still-pond',
  colorPresetId: 'moonmilk',
  explosionPresetId: null,
  shapePresetId: null,
  mixPresetId: null,
  past: [],
  future: [],
  slots: loadSlots(),
  panelOpen: typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  hints: true,
  recording: false,
  panelTab: 'presets',
  selectedEmitterId: null,
  placeMode: false,

  setPanelTab: (panelTab) => set({ panelTab, ...(panelTab !== 'emitters' ? { placeMode: false } : {}) }),
  setPlaceMode: (placeMode) => set({ placeMode }),
  selectEmitter: (selectedEmitterId) =>
    set({
      selectedEmitterId,
      panelTab: 'emitters',
      panelOpen: true,
      placeMode: false,
    }),

  addEmitter: (nx, ny) => {
    const s = get()
    const items = emittersOf(s.params)
    if (items.length >= MAX_EMITTERS) return null
    const next = createEmitter(nx, ny)
    endCoalesce()
    set({
      params: { ...s.params, emitters: { items: [...items, next] } },
      selectedEmitterId: next.id,
      panelTab: 'emitters',
      panelOpen: true,
      placeMode: false,
      past: pushPast(s.past, liveSnap(s)),
      future: [],
    })
    return next.id
  },

  removeEmitter: (id) => {
    const s = get()
    const items = emittersOf(s.params).filter((em) => em.id !== id)
    if (items.length === emittersOf(s.params).length) return
    endCoalesce()
    set({
      params: { ...s.params, emitters: { items } },
      selectedEmitterId: s.selectedEmitterId === id ? items[0]?.id ?? null : s.selectedEmitterId,
      past: pushPast(s.past, liveSnap(s)),
      future: [],
    })
  },

  patchEmitter: (id, patch, opts) =>
    set((s) => {
      const items = emittersOf(s.params)
      const index = items.findIndex((em) => em.id === id)
      if (index < 0) return s
      const next = items.map((em, i) => (i === index ? { ...em, ...patch } : em))
      if (opts?.silent) {
        return { params: { ...s.params, emitters: { items: next } } }
      }
      const field = opts?.field ?? `emitters:${id}:${Object.keys(patch).sort().join(',')}`
      const step = beginCoalesce(field)
      return {
        params: { ...s.params, emitters: { items: next } },
        past: step ? pushPast(s.past, liveSnap(s)) : s.past,
        future: step ? [] : s.future,
      }
    }),

  setSection: (key, patch, opts) =>
    set((s) => {
      if (opts?.silent) {
        return {
          params: { ...s.params, [key]: { ...s.params[key], ...patch } },
        }
      }
      const field = `${key}:${Object.keys(patch).sort().join(',')}`
      const step = beginCoalesce(field)
      return {
        params: { ...s.params, [key]: { ...s.params[key], ...patch } },
        ...(key === 'explosion' ? { explosionPresetId: null } : {}),
        ...(key === 'shape' ? { shapePresetId: null } : {}),
        ...(key === 'physics' && Object.keys(patch).some((k) => k.startsWith('mix') || k.startsWith('on'))
          ? { mixPresetId: null }
          : {}),
        past: step ? pushPast(s.past, liveSnap(s)) : s.past,
        future: step ? [] : s.future,
      }
    }),

  resetSection: (key) =>
    set((s) => {
      endCoalesce()
      return {
        params: { ...s.params, [key]: cloneParams(DEFAULT_PARAMS)[key] },
        ...(key === 'explosion' ? { explosionPresetId: null } : {}),
        ...(key === 'shape' ? { shapePresetId: null } : {}),
        ...(key === 'color' ? { colorPresetId: 'moonmilk' } : {}),
        ...(key === 'physics' ? { mixPresetId: null } : {}),
        ...(key === 'emitters' ? { selectedEmitterId: null, placeMode: false } : {}),
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  resetAll: () =>
    set((s) => {
      endCoalesce()
      return {
        params: cloneParams(DEFAULT_PARAMS),
        behaviorPresetId: 'still-pond',
        colorPresetId: 'moonmilk',
        explosionPresetId: null,
        shapePresetId: null,
        mixPresetId: null,
        selectedEmitterId: null,
        placeMode: false,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  applyBehavior: (id, opts) =>
    set((s) => {
      const params = applyScenePreset(s.params, id)
      const colorPresetId = paletteIdOfScene(id)
      if (opts?.silent) {
        return { params, behaviorPresetId: id, colorPresetId }
      }
      endCoalesce()
      return {
        params,
        behaviorPresetId: id,
        colorPresetId,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  applyColor: (id, opts) =>
    set((s) => {
      if (opts?.silent) {
        return { params: applyColorPreset(s.params, id), colorPresetId: id }
      }
      endCoalesce()
      return {
        params: applyColorPreset(s.params, id),
        colorPresetId: id,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  applyExplosion: (id) =>
    set((s) => {
      endCoalesce()
      return {
        params: applyExplosionPreset(s.params, id),
        explosionPresetId: id,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  applyShape: (id) =>
    set((s) => {
      endCoalesce()
      return {
        params: applyShapePreset(s.params, id),
        shapePresetId: id,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  applyMix: (id) =>
    set((s) => {
      endCoalesce()
      return {
        params: applyMixPreset(s.params, id),
        mixPresetId: id,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  setQuality: (quality) =>
    set((s) => {
      endCoalesce()
      return {
        params: applyQuality({
          ...s.params,
          graphics: { ...s.params.graphics, quality },
        }),
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  randomize: () =>
    set((s) => {
      endCoalesce()
      const next = randomizeParams(s.params)
      return {
        params: next,
        behaviorPresetId: null,
        colorPresetId: null,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  undo: () => {
    endCoalesce()
    const s = get()
    if (!s.past.length) return
    const prev = s.past[s.past.length - 1]
    set({
      ...restore(prev),
      past: s.past.slice(0, -1),
      future: [...s.future, captureSnap(liveSnap(s))].slice(-HISTORY_LIMIT),
    })
  },

  redo: () => {
    endCoalesce()
    const s = get()
    if (!s.future.length) return
    const next = s.future[s.future.length - 1]
    set({
      ...restore(next),
      future: s.future.slice(0, -1),
      past: pushPast(s.past, liveSnap(s)),
    })
  },

  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setHints: (hints) => set({ hints }),
  setRecording: (recording) => set({ recording }),

  saveToSlot: (id, name) => {
    const { params, behaviorPresetId, colorPresetId, slots } = get()
    const existing = slots[id]?.snapshot
    const snapshot = makeSnapshot(
      name || existing?.name || `Szene ${id + 1}`,
      params,
      behaviorPresetId,
      colorPresetId,
      existing?.favorite ?? false,
    )
    set({ slots: writeSlot(slots, id, snapshot) })
  },

  loadSlot: (id) => {
    const slot = get().slots[id]
    if (!slot?.snapshot) return
    set((s) => {
      endCoalesce()
      return {
        params: mergeParams(DEFAULT_PARAMS, slot.snapshot!.params),
        behaviorPresetId: slot.snapshot!.behaviorPresetId,
        colorPresetId: slot.snapshot!.colorPresetId,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    })
  },

  deleteSlot: (id) => set({ slots: clearSlot(get().slots, id) }),
  favoriteSlot: (id) => set({ slots: toggleFavorite(get().slots, id) }),

  saveAsNew: (name) => {
    const { slots } = get()
    const empty = slots.find((slot) => !slot.snapshot)
    const id = empty ? empty.id : 0
    get().saveToSlot(id, name)
  },

  loadSnapshotParams: (params, behavior, color) =>
    set((s) => {
      endCoalesce()
      return {
        params: mergeParams(DEFAULT_PARAMS, params),
        behaviorPresetId: behavior,
        colorPresetId: color,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    }),

  autosave: () => {
    const { params, behaviorPresetId, colorPresetId } = get()
    writeAutosave(makeSnapshot('Automatisch', params, behaviorPresetId, colorPresetId))
  },

  restoreAutosave: () => {
    const snap = readAutosave()
    if (!snap) return false
    set((s) => {
      endCoalesce()
      return {
        params: mergeParams(DEFAULT_PARAMS, snap.params),
        behaviorPresetId: snap.behaviorPresetId,
        colorPresetId: snap.colorPresetId,
        past: pushPast(s.past, liveSnap(s)),
        future: [],
      }
    })
    return true
  },
}))

export const QUALITY_LABEL: Record<string, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  ultra: 'Ultra',
}
