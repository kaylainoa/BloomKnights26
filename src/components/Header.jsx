function Logo() {
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="logo-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#logo-bg)" />
      {/* Sun peeking behind a solar panel */}
      <circle cx="24" cy="12" r="5.5" fill="#fde68a" />
      <path
        d="M8 25.5 17.5 10 27.5 25.5Z"
        fill="url(#logo-panel)"
        stroke="#1d4ed8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 25.5 17.5 15 22.8 25.5M9.6 21h15.8M11 23.2h14"
        stroke="#1d4ed8"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
    </svg>
  )
}

export default function Header({ view, onChangeView, onGoHome }) {
  return (
    <header className="sticky top-0 z-20 h-20 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 rounded-lg transition-opacity duration-150 hover:opacity-70 active:scale-95"
        >
          <Logo />
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
