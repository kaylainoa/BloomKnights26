import { CheckCircle2, Inbox } from 'lucide-react'

/**
 * QuoteRequestsPanel
 * ------------------
 * Shows homeowner quote requests that have come in from the Homeowner tab.
 * The lender can refer each one to OneEthos financing; once approved, the
 * homeowner sees the approval on their own tab.
 *
 * Props:
 *  - requests: array of { id, name, email, address, installer, amount, status, decision }
 *  - onRefer(request): kick off the OneEthos referral for a request.
 */
export default function QuoteRequestsPanel({ requests, onRefer }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Homeowner quote requests</h2>
        {requests.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {requests.length}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Leads from homeowners who requested an installer quote. Refer them to OneEthos
        for instant financing.
      </p>

      {requests.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          No requests yet. When a homeowner requests a quote, it shows up here.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.name || 'Homeowner'}</p>
                  <span className="text-xs text-gray-400">{r.id}</span>
                </div>
                {r.email && (
                  <p className="mt-0.5 truncate text-sm text-gray-600">{r.email}</p>
                )}
                <p className="mt-0.5 truncate text-sm text-gray-600">{r.address}</p>
                <p className="mt-0.5 text-[13px] text-gray-500">
                  Quote from {r.installer}
                  {r.amount ? ` · $${r.amount.toLocaleString()} project` : ''}
                </p>
              </div>

              <div className="shrink-0">
                {r.status === 'approved' ? (
                  <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Approved · ${r.decision?.monthlyPayment?.toLocaleString()}/mo
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRefer(r)}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
                  >
                    Refer to OneEthos financing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
