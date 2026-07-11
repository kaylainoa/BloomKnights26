import { useEffect, useMemo, useRef, useState } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

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

const VIEW_W = 600
const VIEW_H = 500
const PAD = 24

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

function Legend() {
  const items = [
    { color: RED, label: 'High savings, underserved' },
    { color: AMBER, label: 'Moderate opportunity' },
    { color: GREEN, label: 'Already served' },
  ]
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white p-3 shadow-sm">
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-gray-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SvgFallbackMap({ features, selectedTractId, onSelectTract, onHoverTract }) {
  const [tooltip, setTooltip] = useState(null) // { x, y, feature }

  const bounds = useMemo(() => getBounds(features), [features])

  const project = useMemo(() => {
    const { minLng, maxLng, minLat, maxLat } = bounds
    const lngRange = maxLng - minLng || 1
    const latRange = maxLat - minLat || 1
    const innerW = VIEW_W - PAD * 2
    const innerH = VIEW_H - PAD * 2

    return ([lng, lat]) => {
      const x = PAD + ((lng - minLng) / lngRange) * innerW
      // flip Y since lat increases northward but SVG y increases downward
      const y = PAD + innerH - ((lat - minLat) / latRange) * innerH
      return [x, y]
    }
  }, [bounds])

  const polygons = useMemo(() => {
    return features.map((f) => {
      const geoid = f.properties.GEOID
      const rings = f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0])
      const points = rings
        .map((ring) => ring.map((coord) => project(coord).join(',')).join(' '))
      return { geoid, points, feature: f }
    })
  }, [features, project])

  const handleMove = (e, feature) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      feature,
    })
    onHoverTract?.(feature.properties.GEOID)
  }

  const handleLeave = () => {
    setTooltip(null)
    onHoverTract?.(null)
  }

  return (
    <div className="relative h-full w-full bg-gray-100">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {polygons.map(({ geoid, points, feature }) => {
          const isSelected = geoid === selectedTractId
          return points.map((pts, i) => (
            <polygon
              key={`${geoid}-${i}`}
              points={pts}
              fill={scoreColor(feature.properties.opportunity_score)}
              stroke={isSelected ? '#111827' : '#ffffff'}
              strokeWidth={isSelected ? 3 : 1.5}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => onSelectTract(geoid)}
              onMouseMove={(e) => handleMove(e, feature)}
              onMouseLeave={handleLeave}
            />
          ))
        })}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg bg-white p-2.5 text-xs shadow-lg border border-gray-200"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="font-semibold text-gray-900">{tooltip.feature.properties.name}</div>
          <div className="mt-1 text-gray-600">
            Score: <span className="text-gray-900">{tooltip.feature.properties.opportunity_score}</span>
          </div>
          <div className="text-gray-600">
            Avg. savings: <span className="text-gray-900">${tooltip.feature.properties.avg_savings_mo}/mo</span>
          </div>
          <div className="text-gray-600">
            Adoption: <span className="text-gray-900">{tooltip.feature.properties.adoption_pct}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MapboxMap({ features, selectedTractId, onSelectTract, onHoverTract }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const loadedRef = useRef(false)

  const collection = useMemo(
    () => ({ type: 'FeatureCollection', features }),
    [features]
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [{ default: mapboxgl }] = await Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ])

      if (cancelled || !containerRef.current) return

      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-83.5, 29.5],
        zoom: 5.3,
      })

      mapRef.current = map

      map.on('load', () => {
        if (cancelled) return

        map.addSource('tracts', { type: 'geojson', data: collection })

        map.addLayer({
          id: 'tracts-fill',
          type: 'fill',
          source: 'tracts',
          paint: {
            'fill-color': [
              'step',
              ['get', 'opportunity_score'],
              SAGE,
              40,
              GREEN,
              60,
              AMBER,
              85,
              RED,
            ],
            'fill-opacity': 0.85,
          },
        })

        map.addLayer({
          id: 'tracts-line',
          type: 'line',
          source: 'tracts',
          paint: { 'line-color': '#ffffff', 'line-width': 1.5 },
        })

        map.addLayer({
          id: 'tracts-selected',
          type: 'line',
          source: 'tracts',
          paint: { 'line-color': '#111827', 'line-width': 3 },
          filter: ['==', ['get', 'GEOID'], ''],
        })

        const bounds = new mapboxgl.LngLatBounds()
        features.forEach((f) => {
          const rings =
            f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0])
          rings.forEach((ring) => ring.forEach((coord) => bounds.extend(coord)))
        })
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, duration: 0 })
        }

        map.on('click', 'tracts-fill', (e) => {
          const geoid = e.features?.[0]?.properties?.GEOID
          if (geoid) onSelectTract(geoid)
        })

        map.on('mousemove', 'tracts-fill', (e) => {
          const geoid = e.features?.[0]?.properties?.GEOID
          map.getCanvas().style.cursor = 'pointer'
          onHoverTract?.(geoid ?? null)
        })

        map.on('mouseleave', 'tracts-fill', () => {
          map.getCanvas().style.cursor = ''
          onHoverTract?.(null)
        })

        loadedRef.current = true
      })
    }

    init()

    return () => {
      cancelled = true
      loadedRef.current = false
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep source data fresh if features change after load
  useEffect(() => {
    const map = mapRef.current
    if (map && loadedRef.current && map.getSource('tracts')) {
      map.getSource('tracts').setData(collection)
    }
  }, [collection])

  // sync selected highlight
  useEffect(() => {
    const map = mapRef.current
    if (map && loadedRef.current && map.getLayer('tracts-selected')) {
      map.setFilter('tracts-selected', ['==', ['get', 'GEOID'], selectedTractId ?? ''])
    }
  }, [selectedTractId])

  return <div ref={containerRef} className="h-full w-full" />
}

export default function OpportunityMap({ features, selectedTractId, onSelectTract, onHoverTract }) {
  const safeFeatures = features || []
  const hasToken = Boolean(MAPBOX_TOKEN)

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-gray-200">
      {safeFeatures.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-500">
          Loading map…
        </div>
      ) : hasToken ? (
        <MapboxMap
          features={safeFeatures}
          selectedTractId={selectedTractId}
          onSelectTract={onSelectTract}
          onHoverTract={onHoverTract}
        />
      ) : (
        <SvgFallbackMap
          features={safeFeatures}
          selectedTractId={selectedTractId}
          onSelectTract={onSelectTract}
          onHoverTract={onHoverTract}
        />
      )}

      <Legend />
    </div>
  )
}
