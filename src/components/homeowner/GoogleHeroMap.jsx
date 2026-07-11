import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../../services/googleMaps'
import { fetchNearbyZctas, scoreNearbyZips } from '../../services/zipSolarScore'

const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY

const CONTINENTAL_US_CENTER = { lat: 39.8283, lng: -98.5795 }
const US_ZOOM = 4
const ADDRESS_ZOOM = 12

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

/**
 * GoogleHeroMap
 * -------------
 * Real Google Maps view for the homeowner flow: opens on the continental US, then zooms/pans to
 * the searched address and colors nearby ZIP codes by modeled solar savings potential (see
 * services/zipSolarScore.js for what "modeled" means here).
 * Props:
 *  - target ({lat, lng} | null): coordinates to zoom toward. Null shows the full US.
 *  - label (string | null): address text shown in a pill near the marker.
 */
export default function GoogleHeroMap({ target, label }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const dataLayerRef = useRef(null)
  const zctaAbortRef = useRef(null)
  const [status, setStatus] = useState(GOOGLE_MAPS_API_KEY ? 'loading' : 'no-key')

  // Init the map once.
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !containerRef.current) return
    let cancelled = false

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(async (maps) => {
        if (cancelled || !containerRef.current) return
        await maps.importLibrary('marker')
        if (cancelled || !containerRef.current) return

        mapRef.current = new maps.Map(containerRef.current, {
          center: CONTINENTAL_US_CENTER,
          zoom: US_ZOOM,
          minZoom: US_ZOOM,
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

  // Zoom/pan to the target, drop a marker, and color nearby ZIPs by modeled savings potential.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return
    const maps = window.google.maps

    zctaAbortRef.current?.abort()
    dataLayerRef.current?.setMap(null)
    dataLayerRef.current = null
    markerRef.current?.setMap(null)
    markerRef.current = null

    if (!target) {
      map.panTo(CONTINENTAL_US_CENTER)
      map.setZoom(US_ZOOM)
      return
    }

    map.panTo(target)
    const zoomTimeout = setTimeout(() => map.setZoom(ADDRESS_ZOOM), 350)

    markerRef.current = new maps.Marker({
      map,
      position: target,
      title: label ?? undefined,
      animation: maps.Animation.DROP,
    })

    const controller = new AbortController()
    zctaAbortRef.current = controller
    fetchNearbyZctas(target.lat, target.lng, controller.signal)
      .then((features) => {
        if (controller.signal.aborted || !features.length) return
        const scored = scoreNearbyZips(features)
        const data = new maps.Data({ map })
        data.addGeoJson({ type: 'FeatureCollection', features: scored })
        data.setStyle((feature) => ({
          fillColor: scoreColor(feature.getProperty('opportunity_score')),
          fillOpacity: 0.35,
          strokeColor: '#ffffff',
          strokeWeight: 1,
        }))
        dataLayerRef.current = data
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[SolarScope] ZIP overlay unavailable:', err.message)
        }
      })

    return () => clearTimeout(zoomTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, target?.lat, target?.lng])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-xl shadow-slate-200/60">
      <div ref={containerRef} className="h-full w-full" />

      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-500">
          {status === 'no-key' && 'Map unavailable (no API key configured).'}
          {status === 'loading' && 'Loading map…'}
          {status === 'error' && 'Map unavailable right now.'}
        </div>
      )}

      {status === 'ready' && !target && (
        <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 backdrop-blur-sm">
          Anywhere in the U.S.
        </span>
      )}

      {status === 'ready' && target && label && (
        <span className="pointer-events-none absolute bottom-5 left-1/2 max-w-[85%] -translate-x-1/2 truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md animate-fade-in">
          {label}
        </span>
      )}
    </div>
  )
}
