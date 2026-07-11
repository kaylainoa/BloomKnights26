import AiSummary from './AiSummary'
import AltPathCard from './AltPathCard'

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

function MetricCard({ label, value, subtext, tint }) {
  return (
    <div
      className={`flex-1 rounded-2xl p-6 border border-gray-200 ${
        tint ? 'bg-green-50 text-green-800' : 'bg-white text-gray-900'
      }`}
    >
      <p className="text-[13px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-4xl md:text-5xl font-semibold mt-1">{value}</p>
      {subtext && <p className="text-[13px] text-gray-500 mt-1">{subtext}</p>}
    </div>
  )
}

/**
 * ResultsCard
 * -----------
 * Props:
 *  - analysis: the resolved object from getPropertyAnalysis(address), or null/undefined
 *      before a search has been made.
 *  - loading (bool): true while the analysis request is in flight.
 *  - onOpenReferral(): called when the user wants to pursue financing / community solar
 *      referral. Owned by an ancestor component that renders the referral modal.
 *  - onAskQuestion(): called when the user clicks "Ask a question" (stub / no-op ok).
 */
export default function ResultsCard({ analysis, loading, onOpenReferral, onAskQuestion }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <SkeletonBlock className="flex-1 h-28" />
          <SkeletonBlock className="flex-1 h-28" />
          <SkeletonBlock className="flex-1 h-28" />
        </div>
        <SkeletonBlock className="h-28" />
        <div className="flex flex-col md:flex-row gap-4">
          <SkeletonBlock className="flex-1 h-12" />
          <SkeletonBlock className="flex-1 h-12" />
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 animate-fade-slide-in">
      {analysis.type === 'alternative' ? (
        <AltPathCard analysis={analysis} onOpenReferral={onOpenReferral} />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <MetricCard
              label="System Cost"
              value={`$${analysis.systemCostAfterCredit?.toLocaleString()}`}
              subtext="after 30% federal tax credit"
            />
            <MetricCard
              label="Monthly Savings"
              value={`$${analysis.monthlySavings?.toLocaleString()}`}
              subtext="on your electric bill"
              tint
            />
            <MetricCard
              label="Payback Period"
              value={`${analysis.paybackYears} yrs`}
              subtext={`$${analysis.twentyYearSavings?.toLocaleString()} over 20 years`}
            />
          </div>

          <AiSummary text={analysis.aiSummary} />

          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={onOpenReferral}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Request OneEthos Loan
            </button>
            <button
              type="button"
              onClick={onAskQuestion || (() => console.log('Ask a question clicked'))}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Ask a question
            </button>
          </div>
        </>
      )}
    </div>
  )
}
