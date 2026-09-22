"use client"

import { LocateFixed, Navigation2, Loader2, Compass } from "lucide-react"

export type GpsState = "idle" | "searching" | "locked" | "compass"
export type ViewMode = "2d" | "3d"

const glass = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
}

export function MapControls({
  gpsState,
  onLocate,
  viewMode,
  onToggleView,
}: {
  gpsState: GpsState
  onLocate: () => void
  viewMode: ViewMode
  onToggleView: () => void
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      {/* 2D / 3D toggle */}
      <button
        onClick={onToggleView}
        aria-label={viewMode === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
        className="flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur-xl transition active:scale-95"
        style={glass}
      >
        <span className="text-[13px] font-bold tabular-nums" style={{ color: "#0a84ff" }}>
          {viewMode === "3d" ? "3D" : "2D"}
        </span>
      </button>

      {/* GPS button with states */}
      <button
        onClick={onLocate}
        aria-label="Моё местоположение"
        className="flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur-xl transition active:scale-95"
        style={glass}
      >
        <GpsIcon state={gpsState} />
      </button>
    </div>
  )
}

function GpsIcon({ state }: { state: GpsState }) {
  const blue = "#0a84ff"
  if (state === "searching") return <Loader2 size={20} className="animate-spin" style={{ color: blue }} />
  if (state === "compass") return <Compass size={20} style={{ color: blue }} />
  if (state === "locked")
    return <Navigation2 size={19} fill={blue} style={{ color: blue }} />
  return <LocateFixed size={20} style={{ color: "#3c3c43" }} />
}
