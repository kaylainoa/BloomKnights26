import { useEffect, useState } from 'react'
import Header from './components/Header'
import ReferralModal from './components/ReferralModal'
import Hero from './components/homeowner/Hero'
import AddressSearch from './components/homeowner/AddressSearch'
import ResultsCard from './components/homeowner/ResultsCard'
import OpportunityMap from './components/lender/OpportunityMap'
import TractSidebar from './components/lender/TractSidebar'
import { getPropertyAnalysis, getTractScores, generateSummary, referToLender } from './services/api'

export default function App() {
  const [view, setView] = useState('homeowner')

  // Homeowner view state
  const [analysis, setAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Lender view state
  const [tractFeatures, setTractFeatures] = useState([])
  const [loadingTracts, setLoadingTracts] = useState(true)
  const [selectedTractId, setSelectedTractId] = useState(null)

  // Shared referral modal state
  const [referral, setReferral] = useState({ open: false, referralId: null, target: null })

  useEffect(() => {
    getTractScores().then((fc) => {
      setTractFeatures(fc.features)
      setLoadingTracts(false)
    })
  }, [])

  async function handleSelectAddress(address) {
    setLoadingAnalysis(true)
    setAnalysis(null)
    const result = await getPropertyAnalysis(address)
    const aiSummary = await generateSummary(result)
    setAnalysis({ ...result, aiSummary })
    setLoadingAnalysis(false)
  }

  async function openReferral(target) {
    const res = await referToLender(target)
    setReferral({ open: true, referralId: res.referralId, target })
  }

  function closeReferral() {
    setReferral({ open: false, referralId: null, target: null })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header view={view} onChangeView={setView} />

      {view === 'homeowner' && !loadingAnalysis && !analysis && (
        <Hero onSelectAddress={handleSelectAddress} />
      )}

      <main className="mx-auto max-w-7xl px-6 py-10">
        {view === 'homeowner' ? (
          (loadingAnalysis || analysis) && (
            <div className="space-y-6">
              <AddressSearch onSelectAddress={handleSelectAddress} />

              <ResultsCard
                analysis={analysis}
                loading={loadingAnalysis}
                onOpenReferral={() => openReferral(analysis?.address)}
                onAskQuestion={() => console.log('Ask a question stub')}
              />
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Lending opportunity map
              </h1>
              <p className="text-gray-600">
                Census tracts ranked by clean energy financing opportunity in Alachua County, FL.
              </p>
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-[60%]">
                <OpportunityMap
                  features={tractFeatures}
                  selectedTractId={selectedTractId}
                  onSelectTract={setSelectedTractId}
                />
              </div>
              <div className="md:w-[40%]">
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
        )}
      </main>

      <ReferralModal
        open={referral.open}
        onClose={closeReferral}
        referralId={referral.referralId}
        target={referral.target}
      />
    </div>
  )
}
