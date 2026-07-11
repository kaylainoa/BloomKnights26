import { X, CheckCircle2 } from 'lucide-react'

export default function ReferralModal({ open, onClose, referralId, target }) {
  if (!open) return null

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

        <h3 className="mt-4 text-xl font-semibold text-gray-900">Referral sent</h3>
        <p className="mt-2 text-gray-600">
          {target ? (
            <>
              We&apos;ve referred <span className="text-gray-900">{target}</span> to{' '}
              <span className="text-gray-900">OneEthos</span> for financing review.
            </>
          ) : (
            <>We&apos;ve sent this referral to OneEthos for financing review.</>
          )}
        </p>

        {referralId && (
          <p className="mt-4 text-xs text-gray-500">
            Reference ID <span className="text-gray-900">{referralId}</span>
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
