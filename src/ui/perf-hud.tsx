import { useState } from 'react'
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
      aria-expanded={open}
      title={open ? 'Einklappen' : 'Leistung'}
      onClick={() => setOpen((v) => !v)}
      className="pointer-events-auto max-w-full rounded-full px-1.5 py-0.5 font-ui text-[10px] tabular-nums leading-none text-white/32"
    >
      {open ? (
        <span className="whitespace-nowrap">
          {fps.toFixed(0)} fps
          <span className="text-white/18"> · </span>
          {particles}
          <span className="text-white/18"> · </span>
          {frameMs.toFixed(1)} ms
          {memoryMb != null && (
            <>
              <span className="text-white/18"> · </span>
              {memoryMb.toFixed(0)} MB
            </>
          )}
        </span>
      ) : (
        <span>{fps.toFixed(0)}</span>
      )}
    </button>
  )
}
