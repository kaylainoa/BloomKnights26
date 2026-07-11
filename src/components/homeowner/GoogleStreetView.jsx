import { useEffect, useState } from 'react'

const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY

// The panorama's capture point is rarely exactly at the queried coordinates (it's snapped to
// wherever the Street View car actually drove), so pointing the camera at a fixed default
// heading often looks at the road or a neighboring lot instead of the target house. Compute the
// compass bearing from the panorama's real location toward the target so the camera faces it.
function bearingDegrees(from, to) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/**
 * GoogleStreetView
 * ----------------
 * A photo of the actual house, via the Street View Static API — the map shows where the
 * property is, this shows what it looks like. Checks the (free) metadata endpoint first so a
 * "not available here" message can be shown instead of Street View's generic gray placeholder
 * image when there's no coverage for the address.
 * Props:
 *  - target ({lat, lng} | null): coordinates to look up. Null shows an empty state.
 *  - label (string | null): address text shown in a pill over the image.
 */
export default function GoogleStreetView({ target, label }) {
  const [status, setStatus] = useState(target ? 'loading' : 'empty')
  const [heading, setHeading] = useState(null)

  useEffect(() => {
    if (!target) {
      setStatus('empty')
      return
    }
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus('no-key')
      return
    }

    let cancelled = false
    setStatus('loading')
    setHeading(null)

    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${target.lat},${target.lng}&key=${GOOGLE_MAPS_API_KEY}`
    fetch(metadataUrl)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.status === 'OK') {
          if (data.location) {
            setHeading(bearingDegrees(data.location, target))
          }
          setStatus('ready')
        } else if (data.status === 'ZERO_RESULTS') {
          setStatus('unavailable')
        } else {
          // REQUEST_DENIED / OVER_QUERY_LIMIT / INVALID_REQUEST / UNKNOWN_ERROR — a real
          // config or quota problem, not a genuine coverage gap. Surface it distinctly so it
          // doesn't get misread as "this address has no Street View".
          console.warn('[SolarScope] Street View metadata error:', data.status, data.error_message)
          setStatus('error')
        }
      })
      .catch(() => {
        // Metadata lookup failed (e.g. network hiccup) — still attempt the image itself
        // rather than blocking the whole panel on a non-essential check.
        if (!cancelled) setStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [target?.lat, target?.lng])

  const imageUrl =
    target &&
    `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${target.lat},${target.lng}&fov=80${
      heading !== null ? `&heading=${heading}` : ''
    }&key=${GOOGLE_MAPS_API_KEY}`

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-xl shadow-slate-200/60">
      {status === 'ready' && imageUrl && (
        <img
          src={imageUrl}
          alt={label ? `Street view of ${label}` : 'Street view'}
          className="h-full w-full object-cover"
        />
      )}

      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
          {status === 'empty' && 'Search an address to see the house.'}
          {status === 'no-key' && 'Street View unavailable (no API key configured).'}
          {status === 'loading' && 'Loading street view…'}
          {status === 'unavailable' && "Street View isn't available for this address."}
          {status === 'error' && 'Street View is misconfigured — check the API key/restrictions.'}
        </div>
      )}

      {status === 'ready' && label && (
        <span className="pointer-events-none absolute bottom-5 left-1/2 max-w-[85%] -translate-x-1/2 truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md animate-fade-in">
          {label}
        </span>
      )}
    </div>
  )
}
