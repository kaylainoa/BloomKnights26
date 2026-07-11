import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../../services/googleMaps'

const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY

const RED = '#E24B4A'
const AMBER = '#EF9F27'
const GREEN = '#97C459'
const SAGE = '#C0DD97'

function scoreColor(score) {
  if (score >= 85) return RED
  if (score >= 60) return AMBER
  if (score >= 40) return GREEN
  return SAGE
}

function getBounds(features) {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((f) => {
    const rings =
      f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat()
    rings.forEach((ring) => {
      ring.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      })
    })
  })

  return { minLng, maxLng, minLat, maxLat }
}

/**
 * GoogleOpportunityMap
 * ---------------------
 * Real Google Maps basemap (roads, city labels) with the same county-level opportunity
 * choropleth as the plain SVG version, so lenders get geographic context (what's actually
 * near a given county) instead of shapes floating on a blank background.
 * Props: same as OpportunityMap.jsx — features, selectedTractId, onSelectTract, onHoverTract.
 */
export default function GoogleOpportunityMap({ features, selectedTractId, onSelectTract, onHoverTract, focusGeoid, focusNonce }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataLayerRef = useRef(null)
  const firedBoundsRef = useRef(false)
  const [status, setStatus] = useState('loading')
  const [tooltip, setTooltip] = useState(null) // { x, y, feature }

  // Init map once.
  useEffect(() => {
    // Guard against React StrictMode's dev-only double-invoke of effects: the container div
    // persists across the fake mount/unmount/remount, so without this a second Map instance
    // gets created on top of the first, corrupting the DOM Google Maps manages and crashing
    // React's cleanup (removeChild) whenever this component later unmounts for real.
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: 29.65, lng: -83.5 },
          zoom: 6,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            { elementType: 'geometry', stylers: [{ saturation: -65 }, { lightness: 8 }] },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        })
        setStatus('ready')
      })
      .catch((err) => {
        console.warn('[SolarScope] Google Maps unavailable:', err.message)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Load county features into a Data layer once the map + features are ready.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map || !features.length) return
    const maps = window.google.maps

    dataLayerRef.current?.setMap(null)
    const data = new maps.Data({ map })
    data.addGeoJson({ type: 'FeatureCollection', features })
    dataLayerRef.current = data

    data.addListener('click', (e) => onSelectTract?.(e.feature.getProperty('GEOID')))
    data.addListener('mouseover', (e) => {
      onHoverTract?.(e.feature.getProperty('GEOID'))
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip({
        x: e.domEvent.clientX - rect.left,
        y: e.domEvent.clientY - rect.top,
        feature: {
          name: e.feature.getProperty('name'),
          opportunity_score: e.feature.getProperty('opportunity_score'),
          avg_savings_mo: e.feature.getProperty('avg_savings_mo'),
          adoption_pct: e.feature.getProperty('adoption_pct'),
        },
      })
    })
    data.addListener('mousemove', (e) => {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip((t) => (t ? { ...t, x: e.domEvent.clientX - rect.left, y: e.domEvent.clientY - rect.top } : t))
    })
    data.addListener('mouseout', () => {
      onHoverTract?.(null)
      setTooltip(null)
    })

    if (!firedBoundsRef.current) {
      const { minLng, maxLng, minLat, maxLat } = getBounds(features)
      map.fitBounds(
        new maps.LatLngBounds({ lat: minLat, lng: minLng }, { lat: maxLat, lng: maxLng }),
        24
      )
      firedBoundsRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, features])

  // Zoom the map into a specific county when asked (e.g. a homeowner request was clicked).
  // Keyed on focusNonce so clicking the same county again re-zooms; plain map clicks don't
  // bump the nonce, so they only highlight without moving the viewport.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map || !focusGeoid) return
    const feature = features.find((f) => f.properties.GEOID === focusGeoid)
    if (!feature) return
    const maps = window.google.maps
    const { minLng, maxLng, minLat, maxLat } = getBounds([feature])
    map.fitBounds(
      new maps.LatLngBounds({ lat: minLat, lng: minLng }, { lat: maxLat, lng: maxLng }),
      48
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce, status])

  // Re-style on selection change (cheap — no re-add of the layer).
  useEffect(() => {
    const data = dataLayerRef.current
    if (!data) return
    data.setStyle((feature) => {
      const isSelected = feature.getProperty('GEOID') === selectedTractId
      return {
        fillColor: scoreColor(feature.getProperty('opportunity_score')),
        fillOpacity: 0.75,
        strokeColor: isSelected ? '#111827' : '#ffffff',
        strokeWeight: isSelected ? 3 : 1,
      }
    })
  }, [selectedTractId, features])

  return (
    <div className="relative h-full w-full">
      {/* Dedicated, React-untouched container — Google Maps takes ownership of this node's
          DOM contents directly, so no React-managed children can live inside it (that would
          race with Google's own mutations and crash React's unmount cleanup). */}
      <div ref={containerRef} className="h-full w-full" />

      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
          {status === 'error' ? 'Map unavailable right now.' : 'Loading map…'}
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg bg-white p-2.5 text-xs shadow-lg border border-gray-200"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="font-semibold text-gray-900">{tooltip.feature.name}</div>
          <div className="mt-1 text-gray-600">
            Score: <span className="text-gray-900">{tooltip.feature.opportunity_score}</span>
          </div>
          <div className="text-gray-600">
            Avg. savings: <span className="text-gray-900">${tooltip.feature.avg_savings_mo}/mo</span>
          </div>
          <div className="text-gray-600">
            Adoption: <span className="text-gray-900">{tooltip.feature.adoption_pct}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
