import { Sun } from 'lucide-react'

export default function Header({ view, onChangeView, onGoHome }) {
  return (
    <header className="sticky top-0 z-20 h-20 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 rounded-lg transition-opacity duration-150 hover:opacity-70 active:scale-95"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-600/30">
            <Sun className="h-5 w-5 text-white" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">SolarScope</span>
        </button>

        <div className="relative flex items-center rounded-full bg-slate-100 p-1">
          <div
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-snappy ${
              view === 'lender' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            onClick={() => onChangeView('homeowner')}
            className={`relative z-10 flex-1 rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ease-snappy active:scale-95 ${
              view === 'homeowner'
                ? 'font-medium text-gray-900'
                : 'text-slate-500 hover:text-gray-700'
            }`}
          >
            Homeowner
          </button>
          <button
            type="button"
            onClick={() => onChangeView('lender')}
            className={`relative z-10 flex-1 rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ease-snappy active:scale-95 ${
              view === 'lender'
                ? 'font-medium text-gray-900'
                : 'text-slate-500 hover:text-gray-700'
            }`}
          >
            Lender
          </button>
        </div>
      </div>
    </header>
  )
}
