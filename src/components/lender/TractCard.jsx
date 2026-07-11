function scoreBandClasses(score) {
  if (score >= 85) return 'bg-[#E24B4A] text-white'
  if (score >= 60) return 'bg-[#EF9F27] text-white'
  return 'bg-[#97C459] text-white'
}

export default function TractCard({ tract, isSelected, onSelect, onRefer }) {
  const {
    name,
    opportunity_score: score,
    avg_savings_mo,
    adoption_pct,
    energy_burden_pct,
    household_count,
  } = tract

  const showRefer = score >= 60

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
      className={`bg-white rounded-2xl p-4 cursor-pointer transition ${
        isSelected
          ? 'border-2 border-blue-600 bg-blue-50 shadow-sm'
          : 'border border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-snug">{name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBandClasses(
            score
          )}`}
        >
          {score}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <div className="text-xs text-gray-500">Avg. savings/mo</div>
          <div className="text-gray-900">${avg_savings_mo}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Solar adoption</div>
          <div className="text-gray-900">{adoption_pct}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Energy burden</div>
          <div className="text-gray-900">{energy_burden_pct}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Households</div>
          <div className="text-gray-900">{household_count?.toLocaleString?.() ?? household_count}</div>
        </div>
      </div>

      {showRefer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRefer()
          }}
          className="mt-4 w-full rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Refer to OneEthos financing
        </button>
      )}
    </div>
  )
}
