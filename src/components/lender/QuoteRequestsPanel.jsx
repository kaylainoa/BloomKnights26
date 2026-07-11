import { CheckCircle2, Inbox } from 'lucide-react'

/**
 * QuoteRequestsPanel
 * ------------------
 * Shows homeowner quote requests that have come in from the Homeowner tab.
 * The lender can refer each one to OneEthos financing; once approved, the
 * homeowner sees the approval on their own tab.
 *
 * Props:
 *  - requests: array of { id, name, email, address, installer, amount, status, decision, geoid }
 *  - onRefer(request): kick off the OneEthos referral for a request.
 *  - selectedGeoid: GEOID of the currently-focused county, for highlighting the matching request.
 *  - onSelectRequest(request): focus the request's county in the Top Opportunity Counties sidebar.
 */
export default function QuoteRequestsPanel({ requests, onRefer, referringIds = [], selectedGeoid, onSelectRequest }) {
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
          {requests.map((r) => {
            const isSelected = r.geoid && r.geoid === selectedGeoid
            const clickable = Boolean(r.geoid && onSelectRequest)
            return (
            <div
              key={r.id}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onSelectRequest(r) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectRequest(r)
                      }
                    }
                  : undefined
              }
              className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                clickable ? 'cursor-pointer transition' : ''
              } ${
                isSelected
                  ? 'border-2 border-blue-600 bg-blue-50'
                  : `border-gray-200 ${clickable ? 'hover:border-gray-300' : ''}`
              }`}
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
                ) : referringIds.includes(r.id) ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 sm:w-auto">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
                    Reviewing…
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRefer(r)
                    }}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
                  >
                    Refer to OneEthos financing
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
