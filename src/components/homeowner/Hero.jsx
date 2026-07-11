import { Sparkles, Zap, ShieldCheck, Clock } from 'lucide-react'
import AddressSearch from './AddressSearch'
import LoadingScreen from './LoadingScreen'
import ResultsCard from './ResultsCard'
import heroNature from '../../assets/hero-nature.jpg'
import heroVideo from '../../assets/landing-video.mp4'

/**
 * Hero
 * ----
 * Persistent shell for the whole homeowner flow.
 * - mode === 'search': full-bleed video-background landing screen.
 * - mode === 'loading' | 'results': single centered column (no map).
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
  if (mode === 'search') {
    return (
      <section className="relative h-[calc(100vh-80px)] w-full flex items-center overflow-hidden bg-sky-50">
        {/* Background video, with the still photo as poster/fallback while it loads */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={heroVideo}
          poster={heroNature}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Legibility wash so text reads cleanly over the sky/foliage regardless of viewport width */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/10" />

        {/* Soft ambient glow behind the copy, echoing the solar panel's glint in the video */}
        <div className="animate-glow-pulse pointer-events-none absolute left-[8%] top-1/3 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[20%] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="animate-fade-slide-in relative mx-auto w-full max-w-7xl px-6 md:px-12">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Instant, AI-powered solar analysis
            </span>

            <h1 className="mt-5 text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-slate-900">
              Clean energy,
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text text-transparent">
                clear savings
              </span>
            </h1>

            <p className="mt-5 mb-8 text-lg text-slate-700 max-w-md">
              Type your address. See what solar would cost, save, and when it pays for itself.
            </p>

            <AddressSearch onSelectAddress={onSelectAddress} />

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

      <div className="relative mx-auto h-full max-w-3xl overflow-y-auto px-6 py-6 md:px-12">
        {mode === 'loading' && <LoadingScreen address={pendingAddress} />}

        {mode === 'results' && (
          <div className="space-y-6">
            <AddressSearch onSelectAddress={onSelectAddress} />
            <ResultsCard
              analysis={analysis}
              loading={false}
              onRequestQuote={onRequestQuote}
              requests={requests}
            />
          </div>
        )}
      </div>
    </section>
  )
}
