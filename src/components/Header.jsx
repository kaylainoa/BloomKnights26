import logo from '../assets/SolarScopeLogo.png'

export default function Header({ view, onChangeView, onGoHome }) {
  return (
    <header className="sticky top-0 z-20 h-20 bg-gradient-to-b from-white to-white/0">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 rounded-lg transition-opacity duration-150 hover:opacity-70 active:scale-95"
        >
          <img src={logo} alt="SolarScope" className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-gray-900">SolarScope</span>
        </button>

        <div className="relative flex items-center rounded-full bg-slate-100 p-1.5">
          <div
            aria-hidden="true"
            className={`absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-snappy ${
              view === 'lender' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            onClick={() => onChangeView('homeowner')}
            className={`relative z-10 flex-1 rounded-full px-5 py-1.5 text-sm transition-colors duration-150 ease-snappy active:scale-95 ${
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
            className={`relative z-10 flex-1 rounded-full px-5 py-1.5 text-sm transition-colors duration-150 ease-snappy active:scale-95 ${
              view === 'lender'
                ? 'font-medium text-gray-900'
                : 'text-slate-500 hover:text-gray-700'
            }`}
          >
            Contractor
          </button>
        </div>
      </div>
    </header>
  )
}
