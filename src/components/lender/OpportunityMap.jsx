import { useMemo, useState } from 'react'
import stateBoundariesGeojson from '../../data/stateBoundaries.geojson?raw'
import GoogleOpportunityMap from './GoogleOpportunityMap'

const STATE_BOUNDARIES = JSON.parse(stateBoundariesGeojson).features
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

const VIEW_H = 800
const PAD = 24

// Only the outer ring of each polygon part — matches the level of detail already used
// elsewhere here (holes, if any, are ignored).
function outerRings(geometry) {
  return geometry.type === 'Polygon'
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map((part) => part[0])
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

  // Longitude degrees are physically shorter than latitude degrees away from the equator —
  // without correcting for that, a plain lng/lat -> x/y stretch distorts the state outlines.
  // viewW is derived from the corrected aspect ratio so the canvas itself matches the true
  // shape of the data (FL+GA together read tall and narrow, not the old fixed 600x500 box).
  const { viewW, project } = useMemo(() => {
    const { minLng, maxLng, minLat, maxLat } = bounds
    const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180)
    const lngScale = Math.cos(midLatRad)
    const lngRange = (maxLng - minLng) * lngScale || 1
    const latRange = maxLat - minLat || 1

    const innerH = VIEW_H - PAD * 2
    const innerW = innerH * (lngRange / latRange)
    const scale = innerH / latRange

    const projectFn = ([lng, lat]) => {
      const x = PAD + (lng - minLng) * lngScale * scale
      // flip Y since lat increases northward but SVG y increases downward
      const y = PAD + innerH - (lat - minLat) * scale
      return [x, y]
    }

    return { viewW: Math.round(innerW + PAD * 2), project: projectFn }
  }, [bounds])

  const polygons = useMemo(() => {
    return features.map((f) => {
      const geoid = f.properties.GEOID
      const rings = outerRings(f.geometry)
      const points = rings
        .map((ring) => ring.map((coord) => project(coord).join(',')).join(' '))
      return { geoid, points, feature: f }
    })
  }, [features, project])

  const stateOutlines = useMemo(() => {
    return STATE_BOUNDARIES.map((f) => ({
      state: f.properties.state,
      points: outerRings(f.geometry).map((ring) => ring.map((coord) => project(coord).join(',')).join(' ')),
    }))
  }, [project])

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
    <div className="relative flex h-full w-full items-center justify-center bg-gray-100">
      <svg
        viewBox={`0 0 ${viewW} ${VIEW_H}`}
        className="h-full max-w-full"
        style={{ aspectRatio: `${viewW} / ${VIEW_H}` }}
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

        {stateOutlines.map(({ state, points }) =>
          points.map((pts, i) => (
            <polygon
              key={`${state}-border-${i}`}
              points={pts}
              fill="none"
              stroke="#1f2937"
              strokeWidth={1.25}
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          ))
        )}
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

export default function OpportunityMap({ features, selectedTractId, onSelectTract, onHoverTract }) {
  const safeFeatures = features || []

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-gray-200">
      {safeFeatures.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-500">
          Loading map…
        </div>
      ) : GOOGLE_MAPS_API_KEY ? (
        <GoogleOpportunityMap
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
