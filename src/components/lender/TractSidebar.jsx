import { useEffect, useRef, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { downloadTractsCsv } from '../../utils/csv'
import TractCard from './TractCard'

export default function TractSidebar({ features, selectedTractId, onSelectTract, onRefer }) {
  const cardRefs = useRef(new Map())
  const [search, setSearch] = useState('')

  const sorted = [...(features || [])].sort(
    (a, b) => b.properties.opportunity_score - a.properties.opportunity_score
  )

  const filtered = sorted.filter((f) =>
    f.properties.name.toLowerCase().includes(search.trim().toLowerCase())
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
        <h2 className="font-semibold text-gray-900">Top Opportunity Counties</h2>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <Download size={14} />
          Export shortlist (CSV)
        </button>
      </div>

      <div className="relative mb-3 shrink-0">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search counties…"
          className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-500">No counties match "{search}".</div>
        )}
        {filtered.map((feature) => {
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
