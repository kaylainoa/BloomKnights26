import { Sun } from 'lucide-react'

export default function Header({ view, onChangeView }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-blue-600" strokeWidth={2} />
          <span className="text-lg font-semibold text-gray-900">SolarScope</span>
        </div>

        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => onChangeView('homeowner')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              view === 'homeowner'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-500'
            }`}
          >
            Homeowner
          </button>
          <button
            type="button"
            onClick={() => onChangeView('lender')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              view === 'lender'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-500'
            }`}
          >
            Lender
          </button>
        </div>
      </div>
    </header>
  )
}
