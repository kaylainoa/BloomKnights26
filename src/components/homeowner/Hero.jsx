import { useState } from 'react'
import { Sparkles, Zap, ShieldCheck, Clock } from 'lucide-react'
import AddressSearch from './AddressSearch'
import GoogleHeroMap from './GoogleHeroMap'
import LoadingScreen from './LoadingScreen'
import ResultsCard from './ResultsCard'

/**
 * Hero
 * ----
 * Persistent shell for the whole homeowner flow — stays mounted across search, loading, and
 * results so the map never remounts; it just slides from the right (full US, centered) to a
 * pinned left column (zoomed to the address) as `mode` changes.
 * Props:
 *  - mode: 'search' | 'loading' | 'results'
 *  - onSelectAddress(address: string): forwarded to AddressSearch.
 *  - pendingAddress: address text shown by LoadingScreen while mode === 'loading'.
 *  - analysis, onOpenReferral, onAskQuestion: forwarded to ResultsCard while mode === 'results'.
 */
export default function Hero({
  mode,
  onSelectAddress,
  pendingAddress,
  analysis,
  onOpenReferral,
  onAskQuestion,
}) {
  const [mapTarget, setMapTarget] = useState(null)
  const [mapLabel, setMapLabel] = useState(null)

  function handleCoordinates(coords, text) {
    setMapTarget(coords)
    setMapLabel(text)
  }

  const showResults = mode !== 'search'

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Ambient background wash */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[420px] w-[420px] rounded-full bg-amber-100/50 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 75%)',
          }}
        />
      </div>

      <div
        className={`relative mx-auto grid grid-cols-1 items-center gap-10 px-6 md:px-12 max-w-7xl transition-all duration-700 ease-snappy ${
          showResults ? 'md:grid-cols-[1fr_0.85fr] py-10' : 'md:grid-cols-[1.2fr_1fr] min-h-[calc(100vh-80px)]'
        }`}
      >
        {/* Text / search / results column */}
        <div className={`min-w-0 ${showResults ? 'md:order-2' : 'md:order-1 max-w-xl mx-auto md:mx-0 text-left animate-fade-slide-in'}`}>
          {mode === 'search' && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Instant, AI-powered solar analysis
              </span>

              <h1 className="mt-5 text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-slate-900">
                Clean energy,
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  clear savings
                </span>
              </h1>

              <p className="mt-5 mb-8 text-lg text-slate-500 max-w-md">
                Type your address. See what solar would cost, save, and when it pays for itself.
              </p>

              <AddressSearch onSelectAddress={onSelectAddress} onCoordinates={handleCoordinates} />

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Free instant estimate
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Results in seconds
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  No signup required
                </span>
              </div>
            </>
          )}

          {mode === 'loading' && <LoadingScreen address={pendingAddress} />}

          {mode === 'results' && (
            <div className="space-y-6">
              <AddressSearch onSelectAddress={onSelectAddress} onCoordinates={handleCoordinates} />
              <ResultsCard
                analysis={analysis}
                loading={false}
                onOpenReferral={onOpenReferral}
                onAskQuestion={onAskQuestion}
              />
            </div>
          )}
        </div>

        {/* Map column: full US on search, pinned + zoomed once a search starts */}
        <div
          className={`relative min-w-0 w-full ${
            showResults ? 'md:order-1 h-[320px] md:h-[calc(100vh-140px)] md:sticky md:top-24' : 'md:order-2 h-[280px] md:h-[520px]'
          }`}
        >
          <GoogleHeroMap target={mapTarget} label={mapLabel} />
        </div>
      </div>
    </section>
  )
}
