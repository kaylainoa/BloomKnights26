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
 *  - onOpenReferral(): called when the user clicks the community solar CTA.
 */
export default function AltPathCard({ analysis, onOpenReferral }) {
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

      <button
        type="button"
        onClick={onOpenReferral}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        See if you qualify for community solar
      </button>
    </div>
  )
}
