// Day/night terminator + subsolar-point math (no dependencies, no API keys).
// Ported and adapted from the well-known Leaflet.Terminator algorithm.

const RAD = Math.PI / 180

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

function gmst(jd: number): number {
  const d = jd - 2451545.0
  return (18.697374558 + 24.06570982441908 * d) % 24
}

function sunEclipticLongitude(jd: number): { lambda: number } {
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD
  const lambda = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)
  return { lambda }
}

function eclipticObliquity(jd: number): number {
  const n = jd - 2451545.0
  return 23.439 - 0.0000004 * n
}

function sunEquatorialPosition(lambda: number, obliquity: number) {
  let alpha = Math.atan(Math.cos(obliquity * RAD) * Math.tan(lambda * RAD)) / RAD
  const delta = Math.asin(Math.sin(obliquity * RAD) * Math.sin(lambda * RAD)) / RAD
  const lQuadrant = Math.floor(lambda / 90) * 90
  const raQuadrant = Math.floor(alpha / 90) * 90
  alpha += lQuadrant - raQuadrant
  return { alpha, delta }
}

export type SunPosition = { lat: number; lng: number; delta: number; alpha: number; gst: number }

// Geographic point on Earth where the sun is directly overhead.
export function subsolarPoint(date: Date = new Date()): SunPosition {
  const jd = julianDay(date)
  const { lambda } = sunEclipticLongitude(jd)
  const obliquity = eclipticObliquity(jd)
  const { alpha, delta } = sunEquatorialPosition(lambda, obliquity)
  const gst = gmst(jd)
  let lng = alpha - gst * 15
  lng = ((((lng + 180) % 360) + 360) % 360) - 180
  return { lat: delta, lng, delta, alpha, gst }
}

// Great-circle angular distance (degrees) between two lat/lng points.
function angularDistance(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLng = (aLng - bLng) * RAD
  const cos =
    Math.sin(aLat * RAD) * Math.sin(bLat * RAD) +
    Math.cos(aLat * RAD) * Math.cos(bLat * RAD) * Math.cos(dLng)
  return Math.acos(Math.max(-1, Math.min(1, cos))) / RAD
}

// True when the given point is on the night side (sun below horizon).
export function isNight(lat: number, lng: number, sun: SunPosition): boolean {
  return angularDistance(lat, lng, sun.lat, sun.lng) > 90
}

// GeoJSON polygon covering the night hemisphere for the given moment.
export function nightPolygon(date: Date = new Date()): GeoJSON.Feature<GeoJSON.Polygon> {
  const jd = julianDay(date)
  const { lambda } = sunEclipticLongitude(jd)
  const obliquity = eclipticObliquity(jd)
  const sun = sunEquatorialPosition(lambda, obliquity)
  const gst = gmst(jd)

  const coords: [number, number][] = []
  const step = 1
  for (let lng = -180; lng <= 180; lng += step) {
    const ha = gst * 15 + lng - sun.alpha // local hour angle in degrees
    const lat = Math.atan(-Math.cos(ha * RAD) / Math.tan(sun.delta * RAD)) / RAD
    coords.push([lng, lat])
  }

  // Close the ring toward the pole that is currently in darkness.
  if (sun.delta < 0) {
    // Southern winter of the sun -> north pole area is dark
    coords.push([180, 90], [-180, 90], [-180, coords[0][1]])
  } else {
    coords.push([180, -90], [-180, -90], [-180, coords[0][1]])
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  }
}
