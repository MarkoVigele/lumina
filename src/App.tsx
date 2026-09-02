import { useEffect, useRef, useState } from 'react'
import { Simulation } from './engine/simulation'
import { Renderer } from './engine/renderer'
import { cycleIntelligence, Tool, type PointerForce } from './engine/types'
import { emittersOf, hitEmitter } from './engine/emitters'
import { useLumina } from './state/store'
import { ControlPanel } from './ui/panel'
import { Toolbar } from './ui/toolbar'
import { Onboarding } from './ui/onboarding'
import { PerfHud } from './ui/perf-hud'
import { MobileSidebar } from './ui/swipe-sidebar'

const sim = new Simulation()

/** World clock. Independent of display FPS and of touch. */
const SIM_DT = 1 / 60
const MAX_SIM_STEPS = 8
const MAX_FRAME_DT = 0.25

function worldFromEvent(el: HTMLCanvasElement, ev: PointerEvent): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return {
    x: ev.clientX - rect.left,
    y: ev.clientY - rect.top,
  }
}

function readHeapMb(): number | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
  return mem ? mem.usedJSHeapSize / 1048576 : null
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const pointers = useRef<Map<number, PointerForce>>(new Map())
  const paramsRef = useRef(useLumina.getState().params)
  const lastRef = useRef(0)
  const accRef = useRef(0)
  const lastRenderRef = useRef(0)
  const lastClick = useRef(0)
  const dragEmitter = useRef<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [stats, setStats] = useState({ fps: 60, particles: 0, frameMs: 0, memoryMb: null as number | null })
  const [paused, setPaused] = useState(false)

  const params = useLumina((s) => s.params)
  const placeMode = useLumina((s) => s.placeMode)
  const panelOpen = useLumina((s) => s.panelOpen)
  const recording = useLumina((s) => s.recording)
  const setSection = useLumina((s) => s.setSection)
  const randomize = useLumina((s) => s.randomize)
  const saveToSlot = useLumina((s) => s.saveToSlot)
  const loadSlot = useLumina((s) => s.loadSlot)
  const autosave = useLumina((s) => s.autosave)
  const setRecording = useLumina((s) => s.setRecording)
  const setPanelOpen = useLumina((s) => s.setPanelOpen)
  const applyBehavior = useLumina((s) => s.applyBehavior)

  useEffect(() => {
    paramsRef.current = params
    sim.paused = paused
  }, [params, paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new Renderer(canvas)
    rendererRef.current = renderer

    const fit = () => {
      const p = paramsRef.current
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.resize(w, h, p.graphics.resolutionScale, p.graphics.quality)
      sim.resize(w, h)
    }
    fit()
    applyBehavior('still-pond', { silent: true })
    sim.reset(useLumina.getState().params)

    let raf = 0
    let frames = 0
    let fpsT = performance.now()
    let lastMs = 0
    let lastScale = paramsRef.current.graphics.resolutionScale
    let lastQuality = paramsRef.current.graphics.quality

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const p = paramsRef.current
      if (lastRef.current === 0) lastRef.current = now
      const raw = Math.min(MAX_FRAME_DT, Math.max(0, (now - lastRef.current) / 1000))
      lastRef.current = now

      if (p.graphics.resolutionScale !== lastScale || p.graphics.quality !== lastQuality) {
        lastScale = p.graphics.resolutionScale
        lastQuality = p.graphics.quality
        renderer.resize(window.innerWidth, window.innerHeight, lastScale, lastQuality)
      }
      if (sim.width !== window.innerWidth || sim.height !== window.innerHeight) {
        sim.resize(window.innerWidth, window.innerHeight)
      }

      const list = [...pointers.current.values()]
      if (!sim.paused) {
        accRef.current += raw
        let steps = 0
        while (accRef.current >= SIM_DT && steps < MAX_SIM_STEPS) {
          sim.step(p, list, SIM_DT)
          accRef.current -= SIM_DT
          steps++
        }
        if (steps >= MAX_SIM_STEPS) accRef.current = 0
      }

      if (sim.shapes.cycledTo) {
        useLumina.getState().setSection('shape', { shape: sim.shapes.cycledTo }, { silent: true })
      }

      const uncapped = p.graphics.vsync
      const minRenderMs = uncapped ? 0 : 1000 / Math.max(1, p.graphics.fpsLimit)
      if (!uncapped && lastRenderRef.current !== 0 && now - lastRenderRef.current < minRenderMs - 0.5) {
        return
      }

      const t0 = performance.now()
      renderer.render(sim, p, list, useLumina.getState().selectedEmitterId)
      lastRenderRef.current = now
      lastMs = performance.now() - t0
      frames++
      if (now - fpsT > 400) {
        setStats({
          fps: (frames * 1000) / (now - fpsT),
          particles: sim.count,
          frameMs: lastMs,
          memoryMb: readHeapMb(),
        })
        frames = 0
        fpsT = now
      }
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('resize', fit)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
    }
  }, [applyBehavior])

  useEffect(() => {
    const id = window.setInterval(() => autosave(), 30000)
    return () => window.clearInterval(id)
  }, [autosave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const down = (ev: PointerEvent) => {
      const w = worldFromEvent(canvas, ev)
      const p = paramsRef.current
      const items = emittersOf(p)
      const hit = hitEmitter(items, w.x, w.y, sim.width, sim.height)
      const mobile = window.matchMedia('(max-width: 767px)').matches
      if (mobile && useLumina.getState().panelOpen && !hit) {
        ev.preventDefault()
        useLumina.getState().setPanelOpen(false)
        return
      }
      const now = performance.now()
      const dbl = now - lastClick.current < 280
      lastClick.current = now
      const placing = useLumina.getState().placeMode && ev.button === 0
      if (hit && ev.button === 0) {
        ev.preventDefault()
        useLumina.getState().selectEmitter(hit.id)
        dragEmitter.current = hit.id
        canvas.setPointerCapture(ev.pointerId)
        return
      }
      if (placing) {
        ev.preventDefault()
        useLumina.getState().addEmitter(w.x / Math.max(1, sim.width), w.y / Math.max(1, sim.height))
        return
      }
      const tool = ev.button === 2 ? (p.interaction.rightTool ?? Tool.Explode) : p.interaction.tool
      pointers.current.set(ev.pointerId, {
        id: ev.pointerId,
        x: w.x,
        y: w.y,
        px: w.x,
        py: w.y,
        active: true,
        strength: 1,
        tool,
      })
      canvas.setPointerCapture(ev.pointerId)
      if (dbl || tool === Tool.Explode) {
        sim.burst(p, w.x, w.y, 340 * p.interaction.brushStrength, 0.55)
      }
    }

    const move = (ev: PointerEvent) => {
      const w = worldFromEvent(canvas, ev)
      if (dragEmitter.current) {
        useLumina.getState().patchEmitter(
          dragEmitter.current,
          {
            nx: Math.min(1, Math.max(0, w.x / Math.max(1, sim.width))),
            ny: Math.min(1, Math.max(0, w.y / Math.max(1, sim.height))),
          },
          { field: `emitters:move:${dragEmitter.current}` },
        )
        return
      }
      const ptr = pointers.current.get(ev.pointerId)
      if (!ptr) return
      ptr.px = ptr.x
      ptr.py = ptr.y
      ptr.x = w.x
      ptr.y = w.y
      if (ptr.tool === Tool.Throw) {
        sim.throwAt(paramsRef.current, ptr)
      }
    }

    const up = (ev: PointerEvent) => {
      dragEmitter.current = null
      pointers.current.delete(ev.pointerId)
    }

    const wheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const size = paramsRef.current.interaction.brushSize
      const next = Math.min(320, Math.max(24, size + (ev.deltaY > 0 ? -12 : 12)))
      setSection('interaction', { brushSize: next })
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('wheel', wheel, { passive: false })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('wheel', wheel)
    }
  }, [setSection])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement || ev.target instanceof HTMLTextAreaElement) {
        return
      }
      const p = paramsRef.current
      const chord = ev.metaKey || ev.ctrlKey || ev.altKey
      if (!chord) {
        if (ev.code === 'Space') {
          ev.preventDefault()
          setPaused((v) => !v)
        }
        if (ev.key === 'f' || ev.key === 'F') {
          ev.preventDefault()
          useLumina.getState().setSection('shape', { enabled: !p.shape.enabled })
        }
        if (ev.key === 'k' || ev.key === 'K') {
          ev.preventDefault()
          useLumina.getState().setSection('swarm', { intelligence: cycleIntelligence(p.swarm.intelligence) })
        }
        if (ev.key === 'e' || ev.key === 'E') {
          ev.preventDefault()
          useLumina.getState().setSection('explosion', { enabled: !p.explosion.enabled })
        }
        if (ev.key === 'r' || ev.key === 'R') sim.reset(p)
        if (ev.key === 'c' || ev.key === 'C') sim.clear()
        if (ev.key === 'v' || ev.key === 'V') sim.evolve(p)
        if (ev.key === 'x' || ev.key === 'X') randomize()
        if (ev.key === 'h' || ev.key === 'H') setPanelOpen(!useLumina.getState().panelOpen)
        if ((ev.key === 'Backspace' || ev.key === 'Delete') && useLumina.getState().selectedEmitterId) {
          ev.preventDefault()
          useLumina.getState().removeEmitter(useLumina.getState().selectedEmitterId!)
        }
        if (ev.key === '[') setSection('interaction', { brushSize: Math.max(24, p.interaction.brushSize - 12) })
        if (ev.key === ']') setSection('interaction', { brushSize: Math.min(320, p.interaction.brushSize + 12) })
        const tools = [Tool.Attract, Tool.Repel, Tool.Throw, Tool.Cut, Tool.Explode, Tool.Heal, Tool.Paint]
        const n = Number(ev.key)
        if (n >= 1 && n <= 7) setSection('interaction', { tool: tools[n - 1] })
      }
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'z' || ev.key === 'Z')) {
        ev.preventDefault()
        if (ev.shiftKey) useLumina.getState().redo()
        else useLumina.getState().undo()
      }
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'y' || ev.key === 'Y')) {
        ev.preventDefault()
        useLumina.getState().redo()
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') {
        ev.preventDefault()
        saveToSlot(0)
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 'l') {
        ev.preventDefault()
        loadSlot(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loadSlot, randomize, saveToSlot, setPanelOpen, setSection])

  const toggleRecord = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (recorder.current && recorder.current.state === 'recording') {
      recorder.current.stop()
      setRecording(false)
      return
    }
    if (typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      window.alert('Aufnahme wird in diesem Browser nicht unterstützt.')
      return
    }
    const stream = canvas.captureStream(30)
    const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : undefined })
    chunks.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data)
    }
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || 'video/webm' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `lumina-${Date.now()}.webm`
      a.click()
      recorder.current = null
    }
    rec.start()
    recorder.current = rec
    setRecording(true)
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b0d12]">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none ${placeMode ? 'cursor-crosshair' : ''}`}
      />

      <div className="md:hidden">
        <MobileSidebar open={panelOpen} onOpen={() => setPanelOpen(true)} onClose={() => setPanelOpen(false)}>
          <ControlPanel compact />
        </MobileSidebar>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <PerfHud
              fps={stats.fps}
              particles={stats.particles}
              frameMs={stats.frameMs}
              memoryMb={stats.memoryMb}
            />
            <div className="md:hidden">
              <Onboarding />
            </div>
          </div>
          <div className="pointer-events-auto hidden rounded-full border border-white/8 bg-black/25 px-3 py-1 font-ui text-[11px] text-white/45 backdrop-blur-md md:block">
            {params.interaction.tool} · Pinsel {Math.round(params.interaction.brushSize)}
          </div>
          <div className="lumina-kbd-hint ml-auto hidden font-ui text-[11px] text-white/30 md:block">
            Doppelklick explodiert · Rechtsklick zweites Werkzeug
          </div>
        </div>

        <div className="mt-auto flex w-full items-end justify-between gap-3">
          <div className="max-md:hidden">
            <Onboarding />
          </div>
          <div className="ml-auto flex w-full flex-col items-end gap-3 md:w-auto">
            {panelOpen && (
              <div className="hidden h-[min(70dvh,760px)] md:block">
                <ControlPanel />
              </div>
            )}
            <div className="w-full max-md:max-w-none md:w-auto pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-0">
              <Toolbar
                paused={paused}
                recording={recording}
                onPause={() => setPaused((v) => !v)}
                onReset={() => sim.reset(paramsRef.current)}
                onClear={() => {
                  sim.clear()
                  rendererRef.current?.clearTrails()
                }}
                onRandom={() => {
                  randomize()
                  queueMicrotask(() => sim.reset(useLumina.getState().params))
                }}
                onEvolve={() => sim.evolve(paramsRef.current)}
                onRecord={toggleRecord}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
