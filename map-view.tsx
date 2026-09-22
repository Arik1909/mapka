"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { LatLng, LayerType, Place } from "@/lib/maps"
import { CITIES } from "@/lib/cities"
import { isNight, nightPolygon, subsolarPoint } from "@/lib/terminator"

type ViewMode = "2d" | "3d"

export type MapViewProps = {
  layer: LayerType
  viewMode: ViewMode
  markers: Place[]
  userLocation: LatLng | null
  heading: number | null
  route: LatLng[] | null
  flyTo: (LatLng & { zoom?: number }) | null
  fitBounds: LatLng[] | null
  onZoom?: (zoom: number) => void
  onMapClick?: (p: LatLng) => void
}

type RasterDef = { id: string; tiles: string[]; maxzoom?: number; attribution?: string }

const BASE_LAYERS: Record<LayerType, RasterDef[]> = {
  standard: [
    {
      id: "osm",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      maxzoom: 19,
      attribution: "© OpenStreetMap",
    },
  ],
  satellite: [
    {
      id: "esri-imagery",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      maxzoom: 19,
      attribution: "© Esri",
    },
  ],
  hybrid: [
    {
      id: "esri-imagery",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      maxzoom: 19,
      attribution: "© Esri",
    },
    {
      id: "esri-boundaries",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      maxzoom: 19,
    },
    {
      id: "esri-roads",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      maxzoom: 19,
    },
  ],
}

const OVERLAY_IDS = {
  nightSrc: "night-src",
  nightLayer: "night-layer",
  citySrc: "city-src",
  cityGlow: "city-glow",
  cityCore: "city-core",
  routeSrc: "route-src",
  routeCasing: "route-casing",
  routeLine: "route-line",
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] }
}

function userMarkerEl() {
  const wrap = document.createElement("div")
  wrap.className = "am-user-marker"
  wrap.innerHTML = `
    <div class="am-user-cone"></div>
    <div class="am-user-pulse"></div>
    <div class="am-user-dot"></div>
  `
  return wrap
}

function pinEl(color: string) {
  const el = document.createElement("div")
  el.className = "am-pin"
  el.innerHTML = `
    <svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.2 21.7 14.1 22.5.5.4 1.3.4 1.8 0C16.8 36.7 30 25.5 30 15 30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`
  return el
}

export default function MapView(props: MapViewProps) {
  const { layer, viewMode, markers, userLocation, heading, route, flyTo, fitBounds, onZoom, onMapClick } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const destMarkersRef = useRef<maplibregl.Marker[]>([])
  const dayNightTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // keep latest callbacks without re-initialising the map
  const cbRef = useRef({ onZoom, onMapClick })
  cbRef.current = { onZoom, onMapClick }

  // ---- init once ----
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {},
        layers: [],
      },
      center: [37.6173, 55.7558],
      zoom: 2.2,
      attributionControl: false,
      maxPitch: 75,
    })
    mapRef.current = map

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-left")

    map.on("style.load", () => {
      map.setProjection({ type: "globe" })
      map.setSky({
        "sky-color": "#0a0f1f",
        "sky-horizon-blend": 0.6,
        "horizon-color": "#1c3a5e",
        "horizon-fog-blend": 0.6,
        "fog-color": "#0a0f1f",
        "fog-ground-blend": 0.3,
        "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.4, 8, 0],
      })

      buildLayers(map, layer)
      startDayNight(map)
      readyRef.current = true
      cbRef.current.onZoom?.(map.getZoom())
    })

    map.on("zoom", () => cbRef.current.onZoom?.(map.getZoom()))
    map.on("click", (e) => cbRef.current.onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }))

    return () => {
      if (dayNightTimer.current) clearInterval(dayNightTimer.current)
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startDayNight(map: maplibregl.Map) {
    const update = () => {
      const sun = subsolarPoint()
      const nightSrc = map.getSource(OVERLAY_IDS.nightSrc) as maplibregl.GeoJSONSource | undefined
      nightSrc?.setData(nightPolygon() as unknown as GeoJSON.FeatureCollection)

      const lit = CITIES.filter((c) => isNight(c.lat, c.lng, sun))
      const citySrc = map.getSource(OVERLAY_IDS.citySrc) as maplibregl.GeoJSONSource | undefined
      citySrc?.setData({
        type: "FeatureCollection",
        features: lit.map((c) => ({
          type: "Feature",
          properties: { name: c.name },
          geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        })),
      })
    }
    update()
    if (dayNightTimer.current) clearInterval(dayNightTimer.current)
    dayNightTimer.current = setInterval(update, 60000)
  }

  function buildLayers(map: maplibregl.Map, layerType: LayerType) {
    // base rasters
    BASE_LAYERS[layerType].forEach((r) => {
      map.addSource(r.id, {
        type: "raster",
        tiles: r.tiles,
        tileSize: 256,
        maxzoom: r.maxzoom ?? 19,
        attribution: r.attribution ?? "",
      })
      map.addLayer({ id: `${r.id}-layer`, type: "raster", source: r.id })
    })

    // night shadow
    map.addSource(OVERLAY_IDS.nightSrc, { type: "geojson", data: emptyFC() })
    map.addLayer({
      id: OVERLAY_IDS.nightLayer,
      type: "fill",
      source: OVERLAY_IDS.nightSrc,
      paint: {
        "fill-color": "#050a18",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 4, 0.5, 6, 0.28, 9, 0],
      },
    })

    // route
    map.addSource(OVERLAY_IDS.routeSrc, { type: "geojson", data: emptyFC() })
    map.addLayer({
      id: OVERLAY_IDS.routeCasing,
      type: "line",
      source: OVERLAY_IDS.routeSrc,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 6, 16, 12] },
    })
    map.addLayer({
      id: OVERLAY_IDS.routeLine,
      type: "line",
      source: OVERLAY_IDS.routeSrc,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#0a84ff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 7] },
    })

    // city lights (drawn above the night shadow so they glow in darkness)
    map.addSource(OVERLAY_IDS.citySrc, { type: "geojson", data: emptyFC() })
    map.addLayer({
      id: OVERLAY_IDS.cityGlow,
      type: "circle",
      source: OVERLAY_IDS.citySrc,
      maxzoom: 6,
      paint: {
        "circle-color": "#ffd27a",
        "circle-blur": 1.2,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 4, 0.6, 6, 0],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5, 3, 10, 5, 16],
      },
    })
    map.addLayer({
      id: OVERLAY_IDS.cityCore,
      type: "circle",
      source: OVERLAY_IDS.citySrc,
      maxzoom: 6,
      paint: {
        "circle-color": "#fff2cc",
        "circle-blur": 0.4,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 0, 1, 4, 0.7, 6, 0],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 1.4, 3, 2.4, 5, 4],
      },
    })
  }

  // ---- layer switching ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    // remove everything then rebuild in correct order
    ;[
      OVERLAY_IDS.cityCore,
      OVERLAY_IDS.cityGlow,
      OVERLAY_IDS.routeLine,
      OVERLAY_IDS.routeCasing,
      OVERLAY_IDS.nightLayer,
    ].forEach((id) => map.getLayer(id) && map.removeLayer(id))
    ;[OVERLAY_IDS.citySrc, OVERLAY_IDS.routeSrc, OVERLAY_IDS.nightSrc].forEach(
      (id) => map.getSource(id) && map.removeSource(id),
    )
    ;(Object.values(BASE_LAYERS).flat() as RasterDef[]).forEach((r) => {
      if (map.getLayer(`${r.id}-layer`)) map.removeLayer(`${r.id}-layer`)
      if (map.getSource(r.id)) map.removeSource(r.id)
    })
    buildLayers(map, layer)
    startDayNight(map)
    // reapply current route data
    if (route && route.length > 1) setRouteData(map, route)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer])

  // ---- 2D / 3D projection ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    map.setProjection({ type: viewMode === "3d" ? "globe" : "mercator" })
    map.easeTo({ pitch: viewMode === "3d" ? 45 : 0, duration: 600 })
  }, [viewMode])

  // ---- route ----
  function setRouteData(map: maplibregl.Map, coords: LatLng[] | null) {
    const src = map.getSource(OVERLAY_IDS.routeSrc) as maplibregl.GeoJSONSource | undefined
    if (!src) return
    src.setData(
      coords && coords.length > 1
        ? {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords.map((c) => [c.lng, c.lat]) },
          }
        : emptyFC(),
    )
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    setRouteData(map, route)
  }, [route])

  // ---- destination markers ----
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    destMarkersRef.current.forEach((m) => m.remove())
    destMarkersRef.current = markers.map((m) =>
      new maplibregl.Marker({ element: pinEl("#ff3b30"), anchor: "bottom" })
        .setLngLat([m.lng, m.lat])
        .addTo(map),
    )
  }, [markers])

  // ---- user location marker ----
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userLocation) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }
    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ element: userMarkerEl(), rotationAlignment: "map" })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
    }
  }, [userLocation])

  // ---- heading ----
  useEffect(() => {
    const marker = userMarkerRef.current
    if (!marker) return
    const el = marker.getElement()
    if (heading == null || Number.isNaN(heading)) {
      el.classList.remove("has-heading")
    } else {
      el.classList.add("has-heading")
      marker.setRotation(heading)
    }
  }, [heading, userLocation])

  // ---- flyTo ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom ?? 15, duration: 1400, essential: true })
  }, [flyTo])

  // ---- fitBounds ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitBounds || fitBounds.length < 2) return
    const b = new maplibregl.LngLatBounds()
    fitBounds.forEach((c) => b.extend([c.lng, c.lat]))
    map.fitBounds(b, { padding: { top: 90, left: 60, right: 60, bottom: 320 }, duration: 1000 })
  }, [fitBounds])

  return <div ref={containerRef} className="h-full w-full" />
}
