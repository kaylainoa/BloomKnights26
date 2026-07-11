import { useEffect, useRef, useState } from 'react'
import { Zap, ShieldCheck, Clock } from 'lucide-react'
import AddressSearch from './AddressSearch'
import GoogleHeroMap from './GoogleHeroMap'
import GoogleStreetView from './GoogleStreetView'
import LoadingScreen from './LoadingScreen'
import ResultsCard from './ResultsCard'
import heroNature from '../../assets/hero-nature.jpg'
import heroVideo from '../../assets/landing-video.mp4'
import heroVideoReverse from '../../assets/landing-video-reverse.mp4'

// Scrubbing currentTime backward via requestAnimationFrame looks choppy (video seeking snaps to
// the nearest keyframe, not a real frame-by-frame reverse). Instead, this plays two real video
// files — the clip and a pre-rendered reverse encode — swapping which one is visible/playing the
// instant each one ends, so both playback directions are genuine native decode, not scrubbing.
function useBoomerangVideo(forwardRef, reverseRef) {
  const [showReverse, setShowReverse] = useState(false)

  useEffect(() => {
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return

    function toReverse() {
      forward.pause()
      reverse.currentTime = 0
      reverse.play().catch(() => {})
      setShowReverse(true)
    }
    function toForward() {
      reverse.pause()
      forward.currentTime = 0
      forward.play().catch(() => {})
      setShowReverse(false)
    }

    forward.addEventListener('ended', toReverse)
    reverse.addEventListener('ended', toForward)
    return () => {
      forward.removeEventListener('ended', toReverse)
      reverse.removeEventListener('ended', toForward)
    }
  }, [forwardRef, reverseRef])

  return showReverse
}

/**
 * Hero
 * ----
 * Persistent shell for the whole homeowner flow.
 * - mode === 'search': full-bleed video-background landing screen (no map yet — nothing to
 *   zoom to until an address is picked).
 * - mode === 'loading' | 'results': teammate's original two-column layout with GoogleHeroMap
 *   pinned to one side, staying mounted across that transition so the map never remounts.
 * Props:
 *  - mode: 'search' | 'loading' | 'results'
 *  - onSelectAddress(address: string): forwarded to AddressSearch.
 *  - pendingAddress: address text shown by LoadingScreen while mode === 'loading'.
 *  - analysis, onRequestQuote, requests: forwarded to ResultsCard while mode === 'results'.
 */
export default function Hero({
  mode,
  onSelectAddress,
  pendingAddress,
  analysis,
  onRequestQuote,
  requests,
}) {
  const [mapTarget, setMapTarget] = useState(null)
  const [mapLabel, setMapLabel] = useState(null)
  const [mapView, setMapView] = useState('map')
  const forwardVideoRef = useRef(null)
  const reverseVideoRef = useRef(null)
  const showReverse = useBoomerangVideo(forwardVideoRef, reverseVideoRef)

  function handleCoordinates(coords, text) {
    setMapTarget(coords)
    setMapLabel(text)
  }

  if (mode === 'search') {
    return (
      <section className="relative h-[calc(100vh-80px)] w-full flex items-center overflow-hidden bg-sky-50">
        {/* Two real video files (clip + a pre-rendered reverse encode), cross-faded so the
            boomerang loop is genuine native playback in both directions, never a scrub. */}
        <video
          ref={forwardVideoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
            showReverse ? 'opacity-0' : 'opacity-100'
          }`}
          src={heroVideo}
          poster={heroNature}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
        <video
          ref={reverseVideoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
            showReverse ? 'opacity-100' : 'opacity-0'
          }`}
          src={heroVideoReverse}
          muted
          playsInline
          preload="auto"
        />

        {/* Legibility wash so text reads cleanly over the sky/foliage regardless of viewport width */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/10" />

        {/* Soft ambient glow behind the copy, echoing the solar panel's glint in the video */}
        <div className="animate-glow-pulse pointer-events-none absolute left-[8%] top-1/3 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[20%] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="animate-fade-slide-in relative mx-auto w-full max-w-7xl px-6 md:px-12">
          <div className="max-w-xl">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-slate-900">
              Clean energy,
              <br />
              <span className="gradient-text">
                clear savings
              </span>
            </h1>

            <p className="mt-5 mb-8 text-lg text-slate-700 max-w-md">
              Type your address. See what solar would cost, save, and when it pays for itself.
            </p>

            <AddressSearch onSelectAddress={onSelectAddress} onCoordinates={handleCoordinates} />

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
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
          </div>
        </div>
      </section>
    )
  }

  const showResults = mode === 'results'

  return (
    <section className="relative w-full h-full bg-white">
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
        className={`relative mx-auto h-full grid grid-cols-1 items-center gap-10 px-6 md:px-12 py-6 transition-all duration-700 ease-snappy overflow-y-auto ${
          showResults ? 'max-w-[100rem] lg:grid-cols-[1fr_620px]' : 'max-w-7xl md:grid-cols-[1.2fr_1fr]'
        }`}
      >
        {/* Text / loading / results column */}
        <div
          className={`min-w-0 h-full ${
            showResults ? 'lg:order-2 py-6 lg:py-0 lg:overflow-y-auto' : 'md:order-1'
          }`}
        >
          {mode === 'loading' && <LoadingScreen address={pendingAddress} />}

          {showResults && (
            <div className="space-y-6">
              <AddressSearch onSelectAddress={onSelectAddress} onCoordinates={handleCoordinates} />
              <ResultsCard
                analysis={analysis}
                loading={false}
                onRequestQuote={onRequestQuote}
                requests={requests}
              />
            </div>
          )}
        </div>

        {/* Map column: pinned + zoomed to the searched address, with a toggle to switch to an
            actual photo of the house (Street View) once an address is picked. Hidden below lg
            in results mode — there isn't enough room to show it alongside results without
            squeezing them into overflow, so results get the full width instead. */}
        <div
          className={`relative min-w-0 w-full h-full min-h-[280px] ${
            showResults ? 'hidden lg:block lg:order-1' : 'md:order-2'
          }`}
        >
          {mapTarget && (
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center rounded-full bg-white/90 p-1 text-xs font-medium shadow-md backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setMapView('map')}
                className={`rounded-full px-3 py-1.5 transition-colors duration-150 ${
                  mapView === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMapView('house')}
                className={`rounded-full px-3 py-1.5 transition-colors duration-150 ${
                  mapView === 'house' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                House
              </button>
            </div>
          )}

          <div className={mapView === 'map' ? 'h-full w-full' : 'hidden'}>
            <GoogleHeroMap target={mapTarget} label={mapLabel} />
          </div>
          {mapView === 'house' && (
            <div className="h-full w-full">
              <GoogleStreetView target={mapTarget} label={mapLabel} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
