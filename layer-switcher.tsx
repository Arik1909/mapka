"use client"

import type { LayerType } from "@/lib/maps"

const OPTIONS: { value: LayerType; label: string }[] = [
  { value: "standard", label: "Карта" },
  { value: "satellite", label: "Спутник" },
  { value: "hybrid", label: "Гибрид" },
]

export function LayerSwitcher({
  value,
  onChange,
}: {
  value: LayerType
  onChange: (v: LayerType) => void
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full p-1 shadow-lg backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(0,0,0,0.06)" }}
      role="tablist"
      aria-label="Слои карты"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              background: active ? "#0a84ff" : "transparent",
              color: active ? "#fff" : "#1c1c1e",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
