import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { downloadTractsCsv } from '../../utils/csv'
import TractCard from './TractCard'

export default function TractSidebar({ features, selectedTractId, onSelectTract, onRefer }) {
  const cardRefs = useRef(new Map())

  const sorted = [...(features || [])].sort(
    (a, b) => b.properties.opportunity_score - a.properties.opportunity_score
  )

  useEffect(() => {
    if (!selectedTractId) return
    const el = cardRefs.current.get(selectedTractId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedTractId])

  const handleExport = () => {
    downloadTractsCsv(sorted.map((f) => f.properties), 'solarscope-shortlist.csv')
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">Top Opportunity Tracts</h2>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <Download size={14} />
          Export shortlist (CSV)
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {sorted.map((feature) => {
          const geoid = feature.properties.GEOID
          return (
            <div
              key={geoid}
              ref={(el) => {
                if (el) cardRefs.current.set(geoid, el)
                else cardRefs.current.delete(geoid)
              }}
            >
              <TractCard
                tract={feature.properties}
                isSelected={geoid === selectedTractId}
                onSelect={() => onSelectTract(geoid)}
                onRefer={() => onRefer(feature)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
