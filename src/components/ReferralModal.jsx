import { X, CheckCircle2 } from 'lucide-react'

export default function ReferralModal({ open, onClose, target, decision }) {
  if (!open) return null

  const approved = decision?.decision === 'approved'
  const aprPct = decision?.apr != null ? (decision.apr * 100).toFixed(2) : null
  const termYears = decision?.termMonths ? Math.round(decision.termMonths / 12) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-800" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          {approved ? "You're approved!" : 'Referral sent'}
        </h3>
        <p className="mt-2 text-gray-600">
          {approved ? (
            <>
              <span className="text-gray-900">OneEthos</span> approved{' '}
              {target ? <span className="text-gray-900">{target}</span> : 'this project'}{' '}
              for solar financing.
            </>
          ) : target ? (
            <>
              We&apos;ve referred <span className="text-gray-900">{target}</span> to{' '}
              <span className="text-gray-900">OneEthos</span> for financing review.
            </>
          ) : (
            <>We&apos;ve sent this referral to OneEthos for financing review.</>
          )}
        </p>

        {approved && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-[13px] uppercase tracking-wide text-green-700">
              Estimated monthly payment
            </p>
            <p className="mt-1 text-4xl font-semibold text-green-900">
              ${decision.monthlyPayment?.toLocaleString()}
              <span className="text-lg font-normal text-green-700">/mo</span>
            </p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-green-700">Approved amount</dt>
                <dd className="text-green-900">
                  ${decision.approvedAmount?.toLocaleString()}
                </dd>
              </div>
              {aprPct && (
                <div className="flex justify-between">
                  <dt className="text-green-700">Rate (APR)</dt>
                  <dd className="text-green-900">{aprPct}%</dd>
                </div>
              )}
              {termYears && (
                <div className="flex justify-between">
                  <dt className="text-green-700">Term</dt>
                  <dd className="text-green-900">{termYears} years</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {decision?.referralId && (
          <p className="mt-4 text-xs text-gray-500">
            Reference ID <span className="text-gray-900">{decision.referralId}</span>
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  )
}
