"use client"

import { Search, X, Navigation, MapPin, Clock, Car, Footprints, Bike, ChevronLeft } from "lucide-react"
import type { Place, RouteResult } from "@/lib/maps"
import { formatDistance, formatDuration } from "@/lib/maps"

type Profile = "driving" | "walking" | "cycling"

export type SearchSheetProps = {
  query: string
  onQueryChange: (v: string) => void
  onSubmit: () => void
  onClear: () => void
  loading: boolean
  results: Place[]
  onSelectResult: (p: Place) => void
  selected: Place | null
  route: RouteResult | null
  routing: boolean
  routeMode: boolean
  profile: Profile
  onProfileChange: (p: Profile) => void
  onStartRoute: () => void
  onEndRoute: () => void
  onBack: () => void
  error: string | null
}

const PROFILES: { value: Profile; icon: typeof Car; label: string }[] = [
  { value: "driving", icon: Car, label: "Авто" },
  { value: "walking", icon: Footprints, label: "Пешком" },
  { value: "cycling", icon: Bike, label: "Вело" },
]

export function SearchSheet(props: SearchSheetProps) {
  const {
    query,
    onQueryChange,
    onSubmit,
    onClear,
    loading,
    results,
    onSelectResult,
    selected,
    route,
    routing,
    routeMode,
    profile,
    onProfileChange,
    onStartRoute,
    onEndRoute,
    onBack,
    error,
  } = props

  return (
    <div
      className="pointer-events-auto w-full overflow-hidden rounded-t-2xl shadow-2xl backdrop-blur-2xl sm:rounded-2xl"
      style={{ background: "rgba(250,250,252,0.82)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* grabber */}
      <div className="flex justify-center pt-2 pb-1 sm:hidden">
        <div className="h-1.5 w-10 rounded-full" style={{ background: "rgba(0,0,0,0.18)" }} />
      </div>

      <div className="px-3 pb-3 pt-1">
        {/* Search field */}
        {!selected && !routeMode && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(118,118,128,0.12)" }}
            >
              <Search size={18} style={{ color: "#8e8e93" }} />
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Поиск мест и адресов"
                enterKeyHint="search"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#8e8e93]"
                style={{ color: "#1c1c1e" }}
              />
              {query && (
                <button type="button" onClick={onClear} aria-label="Очистить">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "rgba(118,118,128,0.3)" }}>
                    <X size={13} style={{ color: "#fff" }} />
                  </div>
                </button>
              )}
            </form>

            {error && <p className="mt-2 px-1 text-[13px]" style={{ color: "#ff3b30" }}>{error}</p>}

            {loading && <p className="mt-3 px-1 text-[13px]" style={{ color: "#8e8e93" }}>Поиск…</p>}

            {!loading && results.length > 0 && (
              <ul className="mt-2 max-h-[38vh] overflow-y-auto">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelectResult(r)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(10,132,255,0.12)" }}>
                        <MapPin size={17} style={{ color: "#0a84ff" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium" style={{ color: "#1c1c1e" }}>{r.name}</p>
                        <p className="truncate text-[13px]" style={{ color: "#8e8e93" }}>{r.address}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!loading && !results.length && !query && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {["Кафе", "АЗС", "Отели", "Парки"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onQueryChange(c)
                    }}
                    className="flex flex-col items-center gap-1 rounded-xl py-3 text-[12px] font-medium"
                    style={{ background: "rgba(118,118,128,0.1)", color: "#1c1c1e" }}
                  >
                    <MapPin size={18} style={{ color: "#0a84ff" }} />
                    {c}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Selected place detail */}
        {selected && !routeMode && (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-bold" style={{ color: "#1c1c1e" }}>{selected.name}</h2>
                <p className="mt-0.5 text-[14px]" style={{ color: "#8e8e93" }}>{selected.address}</p>
              </div>
              <button onClick={onBack} aria-label="Закрыть" className="shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(118,118,128,0.18)" }}>
                  <X size={16} style={{ color: "#3c3c43" }} />
                </div>
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={onStartRoute}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[15px] font-semibold text-white"
                style={{ background: "#0a84ff" }}
              >
                <Navigation size={17} fill="#fff" />
                Маршрут
              </button>
            </div>
          </div>
        )}

        {/* Route mode */}
        {routeMode && selected && (
          <div>
            <div className="flex items-center gap-2">
              <button onClick={onEndRoute} aria-label="Назад" className="shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(118,118,128,0.18)" }}>
                  <ChevronLeft size={18} style={{ color: "#3c3c43" }} />
                </div>
              </button>
              <div className="min-w-0">
                <p className="text-[12px]" style={{ color: "#8e8e93" }}>Маршрут до</p>
                <p className="truncate text-[16px] font-semibold" style={{ color: "#1c1c1e" }}>{selected.name}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {PROFILES.map((p) => {
                const active = profile === p.value
                const Icon = p.icon
                return (
                  <button
                    key={p.value}
                    onClick={() => onProfileChange(p.value)}
                    className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[12px] font-medium transition-colors"
                    style={{
                      background: active ? "#0a84ff" : "rgba(118,118,128,0.1)",
                      color: active ? "#fff" : "#1c1c1e",
                    }}
                  >
                    <Icon size={18} />
                    {p.label}
                  </button>
                )
              })}
            </div>

            {routing && <p className="mt-3 text-[14px]" style={{ color: "#8e8e93" }}>Прокладываем маршрут…</p>}
            {error && <p className="mt-3 text-[13px]" style={{ color: "#ff3b30" }}>{error}</p>}

            {route && !routing && (
              <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-3" style={{ background: "rgba(52,199,89,0.12)" }}>
                <div>
                  <p className="text-[22px] font-bold" style={{ color: "#1c1c1e" }}>{formatDuration(route.duration)}</p>
                  <div className="flex items-center gap-1 text-[13px]" style={{ color: "#8e8e93" }}>
                    <Clock size={13} />
                    {formatDistance(route.distance)}
                  </div>
                </div>
                <button className="rounded-full px-5 py-2.5 text-[15px] font-semibold text-white" style={{ background: "#34c759" }}>
                  Поехали
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
