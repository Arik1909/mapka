"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

export type Snap = "collapsed" | "half" | "full"

// translateY as a fraction of the sheet height (0 = fully open at top)
const SNAP_FRACTION: Record<Snap, number> = {
  full: 0.0,
  half: 0.5,
  collapsed: 0.78,
}

export function BottomSheet({
  snap,
  onSnapChange,
  children,
  headerless,
}: {
  snap: Snap
  onSnapChange: (s: Snap) => void
  children: ReactNode
  headerless?: boolean
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState<number | null>(null)
  const drag = useRef<{ startY: number; baseY: number; height: number } | null>(null)

  const baseTranslate = useCallback(() => {
    const h = sheetRef.current?.offsetHeight ?? 600
    return SNAP_FRACTION[snap] * h
  }, [snap])

  const onPointerDown = (e: React.PointerEvent) => {
    const h = sheetRef.current?.offsetHeight ?? 600
    drag.current = { startY: e.clientY, baseY: SNAP_FRACTION[snap] * h, height: h }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const delta = e.clientY - drag.current.startY
    const next = Math.max(0, Math.min(drag.current.height, drag.current.baseY + delta))
    setDragY(next)
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const h = drag.current.height
    const current = dragY ?? drag.current.baseY
    const frac = current / h
    // choose nearest snap fraction
    let nearest: Snap = "half"
    let best = Infinity
    ;(Object.keys(SNAP_FRACTION) as Snap[]).forEach((s) => {
      const d = Math.abs(SNAP_FRACTION[s] - frac)
      if (d < best) {
        best = d
        nearest = s
      }
    })
    drag.current = null
    setDragY(null)
    onSnapChange(nearest)
  }

  // recompute on resize
  useEffect(() => {
    const onResize = () => setDragY(null)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const translate = dragY ?? baseTranslate()

  return (
    <div
      ref={sheetRef}
      className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-t-[28px] backdrop-blur-2xl"
      style={{
        height: "90dvh",
        transform: `translateY(${translate}px)`,
        transition: dragY == null ? "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
        background: "rgba(248,248,250,0.78)",
        borderTop: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
      }}
    >
      {!headerless && (
        <div
          className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="h-1.5 w-10 rounded-full" style={{ background: "rgba(60,60,67,0.3)" }} />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
    </div>
  )
}
