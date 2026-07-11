import { useEffect, useState } from 'react'
import { Sun, MapPin, LayoutGrid, PiggyBank, Check, Loader2 } from 'lucide-react'

const STEPS = [
  { icon: MapPin, label: 'Locating your rooftop' },
  { icon: Sun, label: 'Analyzing sun exposure & shading' },
  { icon: LayoutGrid, label: 'Sizing your solar system' },
  { icon: PiggyBank, label: 'Calculating your 20-year savings' },
]

const STEP_INTERVAL_MS = 700

export default function LoadingScreen({ address }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const id = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [address])

  return (
    <div className="animate-fade-slide-in flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-amber-200 opacity-60" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Sun className="h-9 w-9 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
        </span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">Analyzing your home’s solar potential</h2>
      {address && (
        <p className="mt-2 max-w-md text-sm text-gray-500">{address}</p>
      )}

      <ul className="mt-8 w-full max-w-sm space-y-3 text-left">
        {STEPS.map((step, i) => {
          const done = i < activeStep
          const active = i === activeStep
          const Icon = step.icon
          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                done
                  ? 'border-green-200 bg-green-50'
                  : active
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : (
                  <Icon className="h-5 w-5 text-gray-300" />
                )}
              </span>
              <span
                className={`text-sm ${
                  done ? 'text-green-800' : active ? 'text-amber-800' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
