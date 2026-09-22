"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { LayerSwitcher } from "@/components/layer-switcher"
import { MapControls, type GpsState, type ViewMode } from "@/components/map-controls"
import { BottomSheet, type Snap } from "@/components/bottom-sheet"
import { SearchPanel, type Profile } from "@/components/search-panel"
import { getRoute, searchPlaces, type LatLng, type LayerType, type Place, type RouteResult } from "@/lib/maps"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="am-space h-full w-full" />,
})

const DEFAULT_CENTER: LatLng = { lat: 55.7558, lng: 37.6173 } // Москва

function toOsrm(p: Profile): "driving" | "walking" | "cycling" {
  return p === "walking" ? "walking" : "driving"
}

export function AppleMaps() {
  const [layer, setLayer] = useState<LayerType>("standard")
  const [viewMode, setViewMode] = useState<ViewMode>("3d")

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Place | null>(null)
  const [routeMode, setRouteMode] = useState(false)
  const [profile, setProfile] = useState<Profile>("driving")
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routing, setRouting] = useState(false)

  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [gpsState, setGpsState] = useState<GpsState>("idle")

  const [flyTo, setFlyTo] = useState<(LatLng & { zoom?: number }) | null>(null)
  const [fitBounds, setFitBounds] = useState<LatLng[] | null>(null)
  const [snap, setSnap] = useState<Snap>("half")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- live search ----
  useEffect(() => {
    if (selected || routeMode) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const near = userLocation ?? DEFAULT_CENTER
        const places = await searchPlaces(query, near)
        setResults(places)
        setError(places.length ? null : "Ничего не найдено")
      } catch {
        setError("Не удалось выполнить поиск")
      } finally {
        setLoading(false)
      }
    }, 450)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, userLocation, selected, routeMode])

  const runSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const places = await searchPlaces(query, userLocation ?? DEFAULT_CENTER)
      setResults(places)
      setError(places.length ? null : "Ничего не найдено")
      if (places[0]) setFlyTo({ ...places[0], zoom: 13 })
    } catch {
      setError("Не удалось выполнить поиск")
    } finally {
      setLoading(false)
    }
  }, [query, userLocation])

  const onCategory = useCallback(
    async (q: string) => {
      setQuery("")
      setLoading(true)
      setSnap("half")
      try {
        const places = await searchPlaces(q, userLocation ?? DEFAULT_CENTER)
        setResults(places)
        setError(places.length ? null : "Ничего не найдено")
      } catch {
        setError("Не удалось выполнить поиск")
      } finally {
        setLoading(false)
      }
    },
    [userLocation],
  )

  const selectResult = useCallback((p: Place) => {
    setSelected(p)
    setResults([])
    setQuery("")
    setFlyTo({ lat: p.lat, lng: p.lng, zoom: 16 })
    setSnap("half")
  }, [])

  const computeRoute = useCallback(
    async (p: Profile, dest: Place, from: LatLng) => {
      setRouting(true)
      setError(null)
      try {
        const r = await getRoute(from, { lat: dest.lat, lng: dest.lng }, toOsrm(p))
        // OSRM has no public transit engine — approximate from the driving graph.
        const adjusted = p === "transit" ? { ...r, duration: r.duration * 1.7 } : r
        setRoute(adjusted)
        setFitBounds(r.coordinates)
      } catch {
        setError("Не удалось построить маршрут")
        setRoute(null)
      } finally {
        setRouting(false)
      }
    },
    [],
  )

  const startRoute = useCallback(() => {
    if (!selected) return
    setRouteMode(true)
    setSnap("half")
    computeRoute(profile, selected, userLocation ?? DEFAULT_CENTER)
  }, [selected, profile, userLocation, computeRoute])

  const changeProfile = useCallback(
    (p: Profile) => {
      setProfile(p)
      if (routeMode && selected) computeRoute(p, selected, userLocation ?? DEFAULT_CENTER)
    },
    [routeMode, selected, userLocation, computeRoute],
  )

  const endRoute = useCallback(() => {
    setRouteMode(false)
    setRoute(null)
    setFitBounds(null)
    setError(null)
    setSnap("half")
  }, [])

  const back = useCallback(() => {
    setSelected(null)
    setRoute(null)
    setRouteMode(false)
    setFitBounds(null)
    setError(null)
  }, [])

  const clear = useCallback(() => {
    setQuery("")
    setResults([])
    setError(null)
  }, [])

  const onCall = useCallback(() => {
    if (selected?.phone) window.location.href = `tel:${selected.phone.replace(/\s/g, "")}`
  }, [selected])

  const onShare = useCallback(async () => {
    if (!selected) return
    const text = `${selected.name} — ${selected.address}`
    const url = `https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=17/${selected.lat}/${selected.lng}`
    try {
      if (navigator.share) await navigator.share({ title: selected.name, text, url })
      else await navigator.clipboard.writeText(`${text}\n${url}`)
    } catch {
      /* user cancelled */
    }
  }, [selected])

  // ---- geolocation ----
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается")
      return
    }
    setGpsState("searching")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setGpsState(heading != null ? "compass" : "locked")
        setFlyTo({ ...loc, zoom: 15 })
      },
      () => {
        setGpsState("idle")
        setError("Не удалось определить геопозицию")
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [heading])

  // ---- compass / heading ----
  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent & { webkitCompassHeading?: number }) {
      const h = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null)
      if (h != null && !Number.isNaN(h)) {
        setHeading(h)
        setGpsState((s) => (s === "locked" ? "compass" : s))
      }
    }
    window.addEventListener("deviceorientation", onOrient as EventListener)
    return () => window.removeEventListener("deviceorientation", onOrient as EventListener)
  }, [])

  const markers = selected ? [selected] : results.slice(0, 1)

  return (
    <main className="am-root relative h-dvh w-full overflow-hidden" style={{ background: "#000" }}>
      {/* space backdrop shows around the globe */}
      <div className="am-space" />

      <div className="am-map absolute inset-0">
        <MapView
          layer={layer}
          viewMode={viewMode}
          markers={markers}
          userLocation={userLocation}
          heading={heading}
          route={route?.coordinates ?? null}
          flyTo={flyTo}
          fitBounds={fitBounds}
        />
      </div>

      {/* Top controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3 pt-4 sm:p-4">
        <div className="pointer-events-auto">
          <LayerSwitcher value={layer} onChange={setLayer} />
        </div>
        <div className="pointer-events-auto">
          <MapControls
            gpsState={gpsState}
            onLocate={locate}
            viewMode={viewMode}
            onToggleView={() => setViewMode((v) => (v === "3d" ? "2d" : "3d"))}
          />
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-0 z-20" style={{ pointerEvents: "none" }}>
        <BottomSheet snap={snap} onSnapChange={setSnap}>
          <SearchPanel
            query={query}
            onQueryChange={setQuery}
            onSubmit={runSearch}
            onFocusSearch={() => setSnap("full")}
            onClear={clear}
            loading={loading}
            results={results}
            onSelectResult={selectResult}
            onCategory={onCategory}
            selected={selected}
            route={route}
            routing={routing}
            routeMode={routeMode}
            profile={profile}
            onProfileChange={changeProfile}
            onStartRoute={startRoute}
            onEndRoute={endRoute}
            onBack={back}
            onCall={onCall}
            onShare={onShare}
            error={error}
          />
        </BottomSheet>
      </div>
    </main>
  )
}
