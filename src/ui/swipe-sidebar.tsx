import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'

const HANDLE = 28
const PEEK = 0.43
const WIDE = 0.72
const TAP = 8

type Stage = 'closed' | 'peek' | 'wide'

function peekWidth(vw: number) {
  return Math.round(vw * PEEK)
}

function wideWidth(vw: number) {
  return Math.round(Math.min(vw * WIDE, vw - 8))
}

function widthOf(stage: Stage, vw: number) {
  if (stage === 'closed') return HANDLE
  if (stage === 'peek') return peekWidth(vw)
  return wideWidth(vw)
}

function nearestStage(width: number, vw: number): Stage {
  const peek = peekWidth(vw)
  const wide = wideWidth(vw)
  if (width < peek / 2) return 'closed'
  if (width < (peek + wide) / 2) return 'peek'
  return 'wide'
}

export function MobileSidebar({
  open,
  onOpen,
  onClose,
  children,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}) {
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth))
  const [expanded, setExpanded] = useState<'peek' | 'wide'>('peek')
  const [dragging, setDragging] = useState(false)
  const [live, setLive] = useState(HANDLE)
  const startX = useRef(0)
  const startW = useRef(HANDLE)
  const liveRef = useRef(HANDLE)
  const moved = useRef(0)
  const draggingRef = useRef(false)

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (dragging) return
    const stage: Stage = open ? expanded : 'closed'
    const w = widthOf(stage, vw)
    liveRef.current = w
    setLive(w)
  }, [open, expanded, vw, dragging])

  useEffect(() => {
    if (!open) setExpanded('peek')
  }, [open])

  const applyStage = (next: Stage) => {
    if (next === 'closed') {
      setExpanded('peek')
      onClose()
    } else {
      setExpanded(next)
      onOpen()
    }
  }

  const down = (e: PointerEvent<HTMLElement>) => {
    startX.current = e.clientX
    startW.current = liveRef.current
    moved.current = 0
    draggingRef.current = true
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    const dx = startX.current - e.clientX
    moved.current = Math.max(moved.current, Math.abs(e.clientX - startX.current))
    const next = Math.min(wideWidth(vw), Math.max(HANDLE, startW.current + dx))
    liveRef.current = next
    setLive(next)
  }

  const finish = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    if (moved.current < TAP && !open) {
      applyStage('peek')
      return
    }
    applyStage(nearestStage(liveRef.current, vw))
  }

  const collapsed = !open && !dragging

  return (
    <div
      className="pointer-events-auto absolute top-0 right-0 z-20 h-[calc(100dvh-4.5rem)] pt-[max(0.35rem,env(safe-area-inset-top))]"
      style={{
        width: live,
        transition: dragging ? 'none' : 'width 200ms ease',
      }}
    >
      <div className="relative h-full min-w-0 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 z-20 flex w-7 touch-none items-center justify-center"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
          role="separator"
          aria-label="Leiste"
        >
          {collapsed ? (
            <span className="sr-only">Einstellungen</span>
          ) : (
            <span className="h-11 w-1 rounded-full bg-white/30" />
          )}
        </div>
        {collapsed ? (
          <div className="flex h-full items-center">
            <div className="flex h-16 w-7 items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-[#16181e]/80 text-white/70">
              <SlidersHorizontal size={16} />
            </div>
          </div>
        ) : (
          <div className="h-full min-w-0 overflow-hidden">{children}</div>
        )}
      </div>
    </div>
  )
}
