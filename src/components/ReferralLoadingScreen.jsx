import { Loader2, Sparkles } from 'lucide-react'

export default function ReferralLoadingScreen({ target }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 shadow-2xl">
        <div className="flex items-center justify-center rounded-3xl bg-blue-50 p-4 text-blue-700">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Connecting you with OneEthos
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          Preparing your solar financing referral{target ? ` for ${target}` : ''}. OneEthos is reviewing your request now.
        </p>

        <div className="mt-8 rounded-3xl bg-blue-50 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-blue-700">Financing approval request submitted!</p>
          <p className="mt-2 text-4xl font-semibold text-blue-900">Processing request...</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Thank you for choosing OneEthos.</span>
        </div>
      </div>
    </div>
  )
}
