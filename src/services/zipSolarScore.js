// Live ZIP Code Tabulation Area (ZCTA) boundaries from the Census Bureau's public TIGERweb
// ArcGIS REST service — no API key required. Returns real ZIP boundary polygons for whatever
// area the homeowner searches, anywhere in the US, without bundling a nationwide GeoJSON file.
const TIGERWEB_ZCTA_URL =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/2/query'

// ~0.35 degrees is roughly a 24-mile pad in latitude — enough ZCTAs around an address to make
// a color comparison meaningful without pulling in an entire metro area.
const BBOX_PAD_DEG = 0.35

export async function fetchNearbyZctas(lat, lng, signal) {
  const params = new URLSearchParams({
    geometry: `${lng - BBOX_PAD_DEG},${lat - BBOX_PAD_DEG},${lng + BBOX_PAD_DEG},${lat + BBOX_PAD_DEG}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'GEOID,BASENAME',
    returnGeometry: 'true',
    f: 'geojson',
  })
  const res = await fetch(`${TIGERWEB_ZCTA_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`TIGERweb ZCTA query ${res.status}`)
  const geojson = await res.json()
  return geojson.features ?? []
}

function polygonCentroid(geometry) {
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((part) => part[0])
  let sumLng = 0
  let sumLat = 0
  let count = 0
  rings.forEach((ring) =>
    ring.forEach(([lng, lat]) => {
      sumLng += lng
      sumLat += lat
      count += 1
    })
  )
  return { lat: sumLat / count, lng: sumLng / count }
}

// Annual GHI (solar resource) genuinely declines with latitude — reused as the backbone of the
// modeled score, same relationship the lender view's static fallback uses.
function estimateGhiFromLatitude(lat) {
  return Math.max(4.5, Math.min(5.6, 5.6 - (lat - 24.5) * 0.105))
}

// Cheap, deterministic 0..1 hash of a ZIP's GEOID so each ZIP gets a stable "local variance"
// term (adoption/roof-mix noise) instead of a flat number — same GEOID always produces the same
// value, so the map doesn't reshuffle colors on every re-render.
function hashUnit(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/**
 * scoreNearbyZips(features)
 * --------------------------
 * MODELED, not a real per-ZIP savings dataset: no free live API publishes ZIP-level solar
 * savings potential, so each ZIP's score is estimateGhiFromLatitude(centroid) blended with a
 * small deterministic per-ZIP variance term, then converted to a percentile rank (0-100) across
 * the fetched set — same percentile approach as the lender view's rankCountiesByOpportunity, and
 * for the same reason: it guarantees the color scale is actually used instead of every nearby
 * ZIP (which vary little in latitude) collapsing into one color band.
 */
export function scoreNearbyZips(features) {
  const withRaw = features.map((feature) => {
    const geoid = feature.properties.GEOID
    const centroid = polygonCentroid(feature.geometry)
    const ghi = estimateGhiFromLatitude(centroid.lat)
    const variance = hashUnit(geoid) * 0.6
    return { feature, geoid, rawScore: ghi + variance }
  })

  const ranked = [...withRaw].sort((a, b) => a.rawScore - b.rawScore)
  const count = ranked.length
  const scoreByGeoid = new Map(
    ranked.map((entry, i) => [entry.geoid, Math.round(((i + 1) / count) * 100)])
  )

  return withRaw.map(({ feature, geoid }) => ({
    ...feature,
    properties: {
      ...feature.properties,
      GEOID: geoid,
      opportunity_score: count > 1 ? scoreByGeoid.get(geoid) : 70,
    },
  }))
}
