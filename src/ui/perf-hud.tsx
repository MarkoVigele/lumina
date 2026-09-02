import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLumina } from '../state/store'

export function PerfHud({
  fps,
  particles,
  frameMs,
  memoryMb,
}: {
  fps: number
  particles: number
  frameMs: number
  memoryMb: number | null
}) {
  const show = useLumina((s) => s.params.graphics.showPerf !== false)
  const [open, setOpen] = useState(false)
  if (!show) return null

  return (
    <button
      type="button"
      className="pointer-events-auto flex min-h-11 min-w-11 flex-col items-start justify-center rounded-md px-1.5 py-1 text-left md:min-h-7"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-label={open ? 'Leistung ausblenden' : 'Leistung einblenden'}
    >
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums text-white/50">
        {fps.toFixed(0)} fps
        <ChevronDown
          className={`size-2.5 text-white/35 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </span>
      {open ? (
        <span className="mt-1 grid gap-0.5 font-mono text-[10px] leading-snug text-white/48">
          <span>
            {particles} · {frameMs.toFixed(1)} ms
            {memoryMb != null ? ` · ${memoryMb.toFixed(0)} MB` : ''}
          </span>
        </span>
      ) : null}
    </button>
  )
}
