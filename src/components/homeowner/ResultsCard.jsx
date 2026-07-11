import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Star, MapPin, X, CheckCircle2, Clock } from 'lucide-react'
import AiSummary from './AiSummary'
import AltPathCard from './AltPathCard'
import { getNearbyInstallers } from '../../services/api'

// Quick celebratory burst from both bottom corners when a financing approval comes in.
function celebrateApproval() {
  const colors = ['#16a34a', '#22c55e', '#4ade80', '#facc15']
  confetti({ particleCount: 90, spread: 70, origin: { x: 0.15, y: 0.8 }, colors })
  confetti({ particleCount: 90, spread: 70, origin: { x: 0.85, y: 0.8 }, colors })
}

// Fallback when the Places API is unavailable/unconfigured — keeps the section populated
// instead of showing an empty state.
const MOCK_INSTALLERS = [
  {
    name: 'SunPeak Solar',
    rating: 4.9,
    reviews: 412,
    distanceMi: 3.2,
    tag: 'Top rated',
    blurb: 'Premium panels, 25-year workmanship warranty.',
  },
  {
    name: 'BrightPath Energy',
    rating: 4.8,
    reviews: 287,
    distanceMi: 5.6,
    tag: 'Best value',
    blurb: 'Competitive pricing with $0-down financing options.',
  },
  {
    name: 'Evergreen Rooftop Solar',
    rating: 4.7,
    reviews: 198,
    distanceMi: 7.1,
    tag: 'Fast install',
    blurb: 'Local crew, most systems installed within 3 weeks.',
  },
]

// Community-solar "provider" used by the alternative path. Shaped like an installer so it
// flows through the same QuoteModal / quote-request logic.
const COMMUNITY_SOLAR = { name: 'SunShare Community Solar' }

function InstallerCard({ installer, onGetQuote, status }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{installer.name}</p>
          {installer.tag && (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-800">
              {installer.tag}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[13px] text-gray-500">
          {installer.rating != null && (
            <span className="flex items-center gap-1 text-gray-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {installer.rating}
              <span className="text-gray-400">({installer.reviews})</span>
            </span>
          )}
          {installer.distanceMi != null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {installer.distanceMi} mi
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-gray-500 truncate">
          {installer.blurb ?? installer.address}
        </p>
      </div>
      {status === 'approved' ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          Approved
        </span>
      ) : status === 'requested' ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          <Clock className="h-4 w-4" />
          Requested
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onGetQuote(installer)}
          className="shrink-0 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Request quote
        </button>
      )}
    </div>
  )
}

function QuoteModal({ installer, address, onClose, onRequestQuote }) {
  // stage: 'form' -> 'sending' -> 'sent'
  const [stage, setStage] = useState('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  if (!installer) return null

  const emailValid = /.+@.+\..+/.test(email)

  function handleSubmit(e) {
    e.preventDefault()
    if (!emailValid) return
    setStage('sending')
    // Simulated "sending your request to the installer" delay for demo realism.
    setTimeout(() => {
      onRequestQuote?.({ installer: installer.name, name, email })
      setStage('sent')
    }, 1200)
  }

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

        {stage === 'form' && (
          <form onSubmit={handleSubmit}>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Request a {installer.name} quote
            </h3>
            <p className="mt-2 text-gray-600">
              Tell us how to reach you and {installer.name} will prepare a free,
              no-obligation quote
              {address ? (
                <>
                  {' '}for <span className="text-gray-900">{address}</span>
                </>
              ) : null}
              .
            </p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Homeowner"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!emailValid}
              className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Request quote
            </button>
          </form>
        )}

        {stage === 'sending' && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="mt-4 font-medium text-gray-900">Sending your request…</p>
            <p className="mt-1 text-[13px] text-gray-500">
              Connecting you with {installer.name}.
            </p>
          </div>
        )}

        {stage === 'sent' && (
          <>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Quote request sent
            </h3>
            <p className="mt-2 text-gray-600">
              <span className="text-gray-900">{installer.name}</span> will reach out to{' '}
              <span className="text-gray-900">{email}</span> with a custom quote
              {address ? (
                <>
                  {' '}for <span className="text-gray-900">{address}</span>
                </>
              ) : null}
              . We&apos;ll also check your OneEthos financing options — watch this page
              for an approval.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

function MetricCard({ label, value, subtext, tint }) {
  return (
    <div
      className={`min-w-0 rounded-2xl p-6 border border-gray-200 ${
        tint ? 'bg-green-50 text-green-800' : 'bg-white text-gray-900'
      }`}
    >
      <p className="text-[13px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl sm:text-3xl font-semibold mt-1 whitespace-nowrap">{value}</p>
      {subtext && <p className="text-[13px] text-gray-500 mt-1">{subtext}</p>}
    </div>
  )
}

// Shared pending / approval banner for both the rooftop-solar and community-solar paths.
function StatusBanner({ approval, pending, projectNoun }) {
  if (approval) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-800" />
          <h3 className="text-lg font-semibold text-green-900">
            You&apos;re approved for OneEthos financing!
          </h3>
        </div>
        <p className="mt-2 text-green-800">
          OneEthos approved your{' '}
          <span className="font-medium">{approval.installer}</span> {projectNoun}.
        </p>
        <p className="mt-3 text-4xl font-semibold text-green-900">
          ${approval.decision?.monthlyPayment?.toLocaleString()}
          <span className="text-lg font-normal text-green-700">/mo</span>
        </p>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-green-700">Approved amount</dt>
            <dd className="text-green-900">
              ${approval.decision?.approvedAmount?.toLocaleString()}
            </dd>
          </div>
          {approval.decision?.apr != null && (
            <div className="flex justify-between">
              <dt className="text-green-700">Rate (APR)</dt>
              <dd className="text-green-900">
                {(approval.decision.apr * 100).toFixed(2)}%
              </dd>
            </div>
          )}
          {approval.decision?.termMonths && (
            <div className="flex justify-between">
              <dt className="text-green-700">Term</dt>
              <dd className="text-green-900">
                {Math.round(approval.decision.termMonths / 12)} years
              </dd>
            </div>
          )}
          {approval.decision?.referralId && (
            <div className="flex justify-between">
              <dt className="text-green-700">Reference ID</dt>
              <dd className="text-green-900">{approval.decision.referralId}</dd>
            </div>
          )}
        </dl>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-700" />
          <h3 className="text-lg font-semibold text-amber-900">
            Financing request pending
          </h3>
        </div>
        <p className="mt-2 text-amber-800">
          Your quote request to{' '}
          <span className="font-medium">{pending.installer}</span> is in — we&apos;re
          reviewing your OneEthos financing options. Check back here for your approval.
        </p>
      </div>
    )
  }

  return null
}

/**
 * ResultsCard
 * -----------
 * Props:
 *  - analysis: the resolved object from getPropertyAnalysis(address), or null/undefined
 *      before a search has been made.
 *  - loading (bool): true while the analysis request is in flight.
 *  - onRequestQuote({ installer, name, email }): called when the homeowner submits an
 *      installer / community-solar quote request. The ancestor records it so it appears
 *      on the Lender tab.
 *  - requests: quote requests submitted for this address (with status/decision), used to
 *      mark installers as "Requested" and to show the OneEthos approval once a lender refers.
 */
export default function ResultsCard({
  analysis,
  loading,
  onRequestQuote,
  requests = [],
}) {
  const [quoteInstaller, setQuoteInstaller] = useState(null)
  const [installers, setInstallers] = useState(MOCK_INSTALLERS)
  const [loadingInstallers, setLoadingInstallers] = useState(false)

  useEffect(() => {
    if (!analysis?.address || analysis.type === 'alternative') return
    let cancelled = false
    setLoadingInstallers(true)
    getNearbyInstallers(analysis.address)
      .then((real) => {
        if (!cancelled) setInstallers(real && real.length ? real : MOCK_INSTALLERS)
      })
      .finally(() => {
        if (!cancelled) setLoadingInstallers(false)
      })
    return () => {
      cancelled = true
    }
  }, [analysis?.address, analysis?.type])

  const approval = requests.find((r) => r.status === 'approved')
  const pending = !approval && requests.find((r) => r.status !== 'approved')

  // Celebrate once per approval, not on every re-render while it stays approved.
  const celebratedIdRef = useRef(null)
  useEffect(() => {
    if (!approval || celebratedIdRef.current === approval.id) return
    celebratedIdRef.current = approval.id
    celebrateApproval()
  }, [approval])

  // Per-installer status for the card CTA: approved wins over a pending request.
  const installerStatus = (name) => {
    if (requests.some((r) => r.installer === name && r.status === 'approved'))
      return 'approved'
    if (requests.some((r) => r.installer === name)) return 'requested'
    return null
  }

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
      <StatusBanner
        approval={approval}
        pending={pending}
        projectNoun={
          analysis.type === 'alternative' ? 'community solar plan' : 'solar project'
        }
      />

      {analysis.type === 'alternative' ? (
        <AltPathCard
          analysis={analysis}
          onRequestQuote={() => setQuoteInstaller(COMMUNITY_SOLAR)}
          status={installerStatus(COMMUNITY_SOLAR.name)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              value={`${analysis.paybackYears?.toFixed(1)} yrs`}
              subtext={`$${analysis.twentyYearSavings?.toLocaleString()} over 20 years`}
            />
          </div>

          <AiSummary text={analysis.aiSummary} />

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Top recommended local installers
            </h3>
            <p className="mt-1 text-[13px] text-gray-500">
              Highly rated pros near this address, ready to give you a quote.
            </p>
            <div className="mt-4 space-y-3">
              {loadingInstallers ? (
                <>
                  <SkeletonBlock className="h-24" />
                  <SkeletonBlock className="h-24" />
                  <SkeletonBlock className="h-24" />
                </>
              ) : (
                installers.map((installer) => (
                <InstallerCard
                  key={installer.name}
                  installer={installer}
                  onGetQuote={setQuoteInstaller}
                  status={installerStatus(installer.name)}
                />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {quoteInstaller && (
        <QuoteModal
          key={quoteInstaller.name}
          installer={quoteInstaller}
          address={analysis.address}
          onRequestQuote={onRequestQuote}
          onClose={() => setQuoteInstaller(null)}
        />
      )}
    </div>
  )
}
