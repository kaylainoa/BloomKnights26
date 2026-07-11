import { CheckCircle2, Clock } from 'lucide-react'
import AiSummary from './AiSummary'

const REASON_COPY = {
  poor_roof:
    "Your roof isn't well suited for solar panels — limited sun exposure or shading would make a rooftop system take too long to pay off.",
  renter:
    "Since you don't own this property, installing rooftop panels isn't an option available to you.",
}

/**
 * AltPathCard
 * -----------
 * Props:
 *  - analysis: the 'alternative' shaped analysis object from getPropertyAnalysis
 *      ({ address, type: 'alternative', reason, aiSummary, communitySolarSavingsMo, communitySolarSavingsYr, roofSuitability? })
 *  - onRequestQuote(): open the community-solar quote request (same flow as installers).
 *  - status: 'approved' | 'requested' | null — reflects the request's state on the CTA.
 */
export default function AltPathCard({ analysis, onRequestQuote, status }) {
  const reasonText = REASON_COPY[analysis?.reason] || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Solar isn&apos;t the best fit for this address, but here&apos;s your path:
        </h2>
        {reasonText && (
          <p className="mt-2 text-gray-600 leading-relaxed">{reasonText}</p>
        )}
      </div>

      <div className="bg-green-50 text-green-800 rounded-2xl p-6">
        <p className="text-[13px] text-gray-500 uppercase tracking-wide">
          Community solar savings
        </p>
        <p className="text-4xl md:text-5xl font-semibold mt-1">
          ${analysis?.communitySolarSavingsMo}
          <span className="text-lg font-normal">/mo</span>
        </p>
        <p className="text-[13px] mt-1">
          about ${analysis?.communitySolarSavingsYr} per year, no installation required
        </p>
      </div>

      <AiSummary text={analysis?.aiSummary} />

      {status === 'approved' ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-6 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          Approved
        </span>
      ) : status === 'requested' ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-6 py-3 text-sm font-medium text-amber-800">
          <Clock className="h-4 w-4" />
          Requested
        </span>
      ) : (
        <button
          type="button"
          onClick={onRequestQuote}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Request community solar
        </button>
      )}
    </div>
  )
}
