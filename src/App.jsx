import { useEffect, useState } from 'react'
import Header from './components/Header'
import ReferralModal from './components/ReferralModal'
import ReferralLoadingScreen from './components/ReferralLoadingScreen'
import Hero from './components/homeowner/Hero'
import OpportunityMap from './components/lender/OpportunityMap'
import TractSidebar from './components/lender/TractSidebar'
import { getPropertyAnalysis, getTractScores, generateSummary, referToLender } from './services/api'

export default function App() {
  const [view, setView] = useState('homeowner')

  // Homeowner view state
  const [analysis, setAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [pendingAddress, setPendingAddress] = useState('')

  // Lender view state
  const [tractFeatures, setTractFeatures] = useState([])
  const [loadingTracts, setLoadingTracts] = useState(true)
  const [selectedTractId, setSelectedTractId] = useState(null)

  // Shared referral modal state
  const [referral, setReferral] = useState({ open: false, target: null, decision: null })
  const [referralLoading, setReferralLoading] = useState(false)

  useEffect(() => {
    getTractScores().then((fc) => {
      setTractFeatures(fc.features)
      setLoadingTracts(false)
    })
  }, [])

  async function handleSelectAddress(address) {
    setPendingAddress(address)
    setLoadingAnalysis(true)
    setAnalysis(null)
    const result = await getPropertyAnalysis(address)
    const aiSummary = await generateSummary(result)
    setAnalysis({ ...result, aiSummary })
    setLoadingAnalysis(false)
  }

  async function openReferral(target, amount) {
    setReferral({ open: false, target, decision: null })
    setReferralLoading(true)

    try {
      const res = await referToLender(target, { amount })
      setReferral({ open: true, target, decision: res })
    } finally {
      setReferralLoading(false)
    }
  }

  function closeReferral() {
    setReferral({ open: false, target: null, decision: null })
  }

  function goHome() {
    setView('homeowner')
    setAnalysis(null)
    setLoadingAnalysis(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Header view={view} onChangeView={setView} onGoHome={goHome} />

      <div className={`flex-1 min-h-0 ${view === 'homeowner' ? '' : 'hidden'}`}>
        <Hero
          mode={loadingAnalysis ? 'loading' : analysis ? 'results' : 'search'}
          onSelectAddress={handleSelectAddress}
          pendingAddress={pendingAddress}
          analysis={analysis}
          onOpenReferral={() => openReferral(analysis?.address, analysis?.systemCostAfterCredit)}
          onAskQuestion={() => console.log('Ask a question stub')}
        />
      </div>

      {/* Always mounted (just hidden) once first shown — GoogleOpportunityMap manages DOM
          nodes directly inside its container that React can't safely tear down on unmount,
          so this view is toggled with CSS instead of conditional rendering. */}
      <main className={`flex-1 min-h-0 overflow-y-auto mx-auto w-full max-w-7xl px-6 py-10 ${view === 'lender' ? '' : 'hidden'}`}>
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Lending opportunity map
              </h1>
              <p className="text-gray-600">
                Florida and Georgia counties ranked by clean energy financing opportunity.
              </p>
            </div>

            <div className="flex flex-col gap-6 md:h-[880px] md:flex-row">
              <div className="flex min-h-0 flex-col gap-3 md:w-[60%]">
                <div className="min-h-0 flex-1">
                  <OpportunityMap
                    features={tractFeatures}
                    selectedTractId={selectedTractId}
                    onSelectTract={setSelectedTractId}
                  />
                </div>
                <p className="shrink-0 text-xs leading-relaxed text-gray-500">
                  <span className="font-medium text-gray-700">How this is scored: </span>
                  Each county gets a percentile rank (0–100) relative to the others shown here,
                  based on estimated solar savings, energy burden (electricity cost as a share of
                  income), and solar adoption. <span className="font-medium text-gray-700">Adoption</span> is
                  an estimate of how many households likely already have solar — modeled from
                  income and population density, since no public dataset tracks this directly.
                  Counties with high savings potential, high burden, and low adoption rank highest
                  (red, underserved); counties where solar has already taken hold rank lowest
                  (green, already served).
                </p>
              </div>
              <div className="min-h-0 md:w-[40%]">
                <TractSidebar
                  features={tractFeatures}
                  selectedTractId={selectedTractId}
                  onSelectTract={setSelectedTractId}
                  onRefer={(feature) => openReferral(feature.properties.name)}
                  loading={loadingTracts}
                />
              </div>
            </div>
          </div>
      </main>

      {referralLoading && <ReferralLoadingScreen target={referral.target} />}
      <ReferralModal
        open={referral.open}
        onClose={closeReferral}
        target={referral.target}
        decision={referral.decision}
      />
    </div>
  )
}
