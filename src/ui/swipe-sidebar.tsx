import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

const THRESHOLD = 72

export function SwipeSidebar({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  const startX = useRef<number | null>(null)
  const dxRef = useRef(0)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const finish = () => {
    const moved = dxRef.current
    startX.current = null
    dxRef.current = 0
    setDragging(false)
    setDx(0)
    if (moved > THRESHOLD) onClose()
  }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX
    dxRef.current = 0
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const next = Math.max(0, e.clientX - startX.current)
    dxRef.current = next
    setDx(next)
  }

  return (
    <div
      className="relative h-full w-full"
      style={{
        transform: `translateX(${dx}px)`,
        transition: dragging ? 'none' : 'transform 180ms ease',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 z-20 flex w-7 touch-none items-center justify-center"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        role="separator"
        aria-label="Zur Seite wischen"
      >
        <span className="h-11 w-1 rounded-full bg-white/30" />
      </div>
      {children}
    </div>
  )
}
