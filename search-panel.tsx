"use client"

import {
  Search,
  X,
  Navigation,
  MapPin,
  Clock,
  Car,
  Footprints,
  Bus,
  ChevronLeft,
  Phone,
  Share,
  Utensils,
  Fuel,
  BedDouble,
  SquareParking,
} from "lucide-react"
import type { Place, RouteResult } from "@/lib/maps"
import { formatDistance, formatDuration } from "@/lib/maps"

export type Profile = "driving" | "walking" | "transit"

export type SearchPanelProps = {
  query: string
  onQueryChange: (v: string) => void
  onSubmit: () => void
  onFocusSearch: () => void
  onClear: () => void
  loading: boolean
  results: Place[]
  onSelectResult: (p: Place) => void
  onCategory: (q: string) => void
  selected: Place | null
  route: RouteResult | null
  routing: boolean
  routeMode: boolean
  profile: Profile
  onProfileChange: (p: Profile) => void
  onStartRoute: () => void
  onEndRoute: () => void
  onBack: () => void
  onCall: () => void
  onShare: () => void
  error: string | null
}

const PROFILES: { value: Profile; icon: typeof Car; label: string }[] = [
  { value: "driving", icon: Car, label: "Авто" },
  { value: "transit", icon: Bus, label: "Транспорт" },
  { value: "walking", icon: Footprints, label: "Пешком" },
]

const CATEGORIES: { label: string; query: string; icon: typeof Utensils; color: string }[] = [
  { label: "Еда", query: "ресторан кафе", icon: Utensils, color: "#ff9500" },
  { label: "Заправки", query: "азс заправка", icon: Fuel, color: "#34c759" },
  { label: "Отели", query: "отель гостиница", icon: BedDouble, color: "#af52de" },
  { label: "Парковки", query: "парковка", icon: SquareParking, color: "#0a84ff" },
]

export function SearchPanel(props: SearchPanelProps) {
  const {
    query,
    onQueryChange,
    onSubmit,
    onFocusSearch,
    onClear,
    loading,
    results,
    onSelectResult,
    onCategory,
    selected,
    route,
    routing,
    routeMode,
    profile,
    onProfileChange,
    onStartRoute,
    onEndRoute,
    onBack,
    onCall,
    onShare,
    error,
  } = props

  // ---- Route planning view ----
  if (routeMode && selected) {
    return (
      <div>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onEndRoute} aria-label="Назад" className="shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(118,118,128,0.16)" }}
            >
              <ChevronLeft size={20} style={{ color: "#3c3c43" }} />
            </div>
          </button>
          <div className="min-w-0">
            <p className="text-[12px]" style={{ color: "#8e8e93" }}>
              Маршрут до
            </p>
            <p className="truncate text-[17px] font-semibold" style={{ color: "#1c1c1e" }}>
              {selected.name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {PROFILES.map((p) => {
            const active = profile === p.value
            const Icon = p.icon
            return (
              <button
                key={p.value}
                onClick={() => onProfileChange(p.value)}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 text-[12px] font-medium transition"
                style={{
                  background: active ? "#0a84ff" : "rgba(118,118,128,0.12)",
                  color: active ? "#fff" : "#1c1c1e",
                }}
              >
                <Icon size={20} />
                {p.label}
              </button>
            )
          })}
        </div>

        {routing && (
          <p className="mt-4 text-[14px]" style={{ color: "#8e8e93" }}>
            Прокладываем маршрут…
          </p>
        )}
        {error && (
          <p className="mt-4 text-[13px]" style={{ color: "#ff3b30" }}>
            {error}
          </p>
        )}

        {route && !routing && (
          <div
            className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(52,199,89,0.14)" }}
          >
            <div>
              <p className="text-[24px] font-bold leading-tight" style={{ color: "#1c1c1e" }}>
                {formatDuration(route.duration)}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[13px]" style={{ color: "#8e8e93" }}>
                <Clock size={13} />
                {formatDistance(route.distance)}
                {profile === "transit" && <span className="ml-1">· примерно</span>}
              </div>
            </div>
            <button
              className="rounded-full px-6 py-2.5 text-[15px] font-semibold text-white active:scale-95"
              style={{ background: "#34c759" }}
            >
              Поехали
            </button>
          </div>
        )}
      </div>
    )
  }

  // ---- Selected place detail ----
  if (selected) {
    return (
      <div className="pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-[22px] font-bold" style={{ color: "#1c1c1e" }}>
              {selected.name}
            </h2>
            <p className="mt-0.5 text-[14px] capitalize" style={{ color: "#8e8e93" }}>
              {selected.category || "Место"}
            </p>
          </div>
          <button onClick={onBack} aria-label="Закрыть" className="shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(118,118,128,0.18)" }}
            >
              <X size={17} style={{ color: "#3c3c43" }} />
            </div>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onStartRoute}
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
            style={{ background: "#0a84ff" }}
          >
            <Navigation size={17} fill="#fff" />
            Маршрут
          </button>
          <button
            onClick={onCall}
            disabled={!selected.phone}
            aria-label="Позвонить"
            className="flex flex-1 items-center justify-center rounded-2xl py-3 active:scale-[0.98] disabled:opacity-40"
            style={{ background: "rgba(118,118,128,0.14)" }}
          >
            <Phone size={19} style={{ color: "#0a84ff" }} />
          </button>
          <button
            onClick={onShare}
            aria-label="Поделиться"
            className="flex flex-1 items-center justify-center rounded-2xl py-3 active:scale-[0.98]"
            style={{ background: "rgba(118,118,128,0.14)" }}
          >
            <Share size={19} style={{ color: "#0a84ff" }} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Row label="Адрес" value={selected.address} />
          {selected.phone && <Row label="Телефон" value={selected.phone} />}
          {selected.website && (
            <Row
              label="Сайт"
              value={selected.website.replace(/^https?:\/\//, "")}
              href={selected.website}
            />
          )}
          <Row label="Координаты" value={`${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`} />
        </div>
      </div>
    )
  }

  // ---- Search view ----
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(118,118,128,0.14)" }}
      >
        <Search size={18} style={{ color: "#8e8e93" }} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocusSearch}
          placeholder="Поиск мест и адресов"
          enterKeyHint="search"
          className="w-full bg-transparent text-[16px] outline-none placeholder:text-[#8e8e93]"
          style={{ color: "#1c1c1e" }}
        />
        {query && (
          <button type="button" onClick={onClear} aria-label="Очистить">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: "rgba(118,118,128,0.4)" }}
            >
              <X size={13} style={{ color: "#fff" }} />
            </div>
          </button>
        )}
      </form>

      {error && (
        <p className="mt-2 px-1 text-[13px]" style={{ color: "#ff3b30" }}>
          {error}
        </p>
      )}
      {loading && (
        <p className="mt-3 px-1 text-[13px]" style={{ color: "#8e8e93" }}>
          Поиск…
        </p>
      )}

      {!loading && results.length > 0 && (
        <ul className="mt-2">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onSelectResult(r)}
                className="flex w-full items-center gap-3 py-2.5 text-left"
                style={{ borderBottom: "1px solid rgba(60,60,67,0.12)" }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(10,132,255,0.12)" }}
                >
                  <MapPin size={17} style={{ color: "#0a84ff" }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium" style={{ color: "#1c1c1e" }}>
                    {r.name}
                  </p>
                  <p className="truncate text-[13px]" style={{ color: "#8e8e93" }}>
                    {r.address}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !results.length && !query && (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.label}
                  onClick={() => onCategory(c.query)}
                  className="flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <div
                    className="flex h-14 w-full items-center justify-center rounded-2xl"
                    style={{ background: "rgba(118,118,128,0.12)" }}
                  >
                    <Icon size={22} style={{ color: c.color }} />
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: "#1c1c1e" }}>
                    {c.label}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-5 px-1 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "#8e8e93" }}>
            Быстрый доступ
          </p>
          <div className="mt-2 rounded-2xl" style={{ background: "rgba(118,118,128,0.08)" }}>
            {["Дом", "Работа", "Отмеченные места"].map((t, i) => (
              <div
                key={t}
                className="flex items-center gap-3 px-3 py-3"
                style={{ borderBottom: i < 2 ? "1px solid rgba(60,60,67,0.1)" : "none" }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(10,132,255,0.12)" }}
                >
                  <MapPin size={16} style={{ color: "#0a84ff" }} />
                </div>
                <span className="text-[15px]" style={{ color: "#1c1c1e" }}>
                  {t}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5" style={{ borderBottom: "1px solid rgba(60,60,67,0.1)", paddingBottom: 10 }}>
      <span className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "#8e8e93" }}>
        {label}
      </span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-[15px] font-medium" style={{ color: "#0a84ff" }}>
          {value}
        </a>
      ) : (
        <span className="text-[15px]" style={{ color: "#1c1c1e" }}>
          {value}
        </span>
      )}
    </div>
  )
}
