export type LatLng = { lat: number; lng: number }

export type Place = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  category?: string
  phone?: string
  website?: string
}

export type RouteResult = {
  coordinates: LatLng[]
  distance: number // meters
  duration: number // seconds
}

export type LayerType = "standard" | "satellite" | "hybrid"

// Geocoding search via OpenStreetMap Nominatim (no API key required)
export async function searchPlaces(query: string, near?: LatLng): Promise<Place[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    limit: "8",
  })

  if (near) {
    // bias results toward the current view
    const d = 0.5
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`)
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })

  if (!res.ok) throw new Error("Search failed")

  const data = (await res.json()) as Array<{
    place_id: number
    display_name: string
    name?: string
    lat: string
    lon: string
    type?: string
    category?: string
    extratags?: Record<string, string> | null
  }>

  return data.map((d) => {
    const parts = d.display_name.split(",")
    const tags = d.extratags ?? {}
    return {
      id: String(d.place_id),
      name: d.name?.trim() || parts[0]?.trim() || "Без названия",
      address: parts.slice(1).join(",").trim() || d.display_name,
      lat: Number.parseFloat(d.lat),
      lng: Number.parseFloat(d.lon),
      category: d.type || d.category,
      phone: tags.phone || tags["contact:phone"] || undefined,
      website: tags.website || tags["contact:website"] || undefined,
    }
  })
}

// Routing via public OSRM demo server (no API key required)
export async function getRoute(from: LatLng, to: LatLng, profile: "driving" | "walking" | "cycling" = "driving"): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`

  const res = await fetch(url)
  if (!res.ok) throw new Error("Routing failed")

  const data = await res.json()
  if (!data.routes?.length) throw new Error("No route found")

  const route = data.routes[0]
  const coordinates: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => ({
    lat: c[1],
    lng: c[0],
  }))

  return {
    coordinates,
    distance: route.distance,
    duration: route.duration,
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} м`
  return `${(meters / 1000).toFixed(1)} км`
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} мин`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem ? `${hours} ч ${rem} мин` : `${hours} ч`
}
