import AddressSearch from './AddressSearch'

/**
 * Hero
 * ----
 * Landing hero shown before any search happens in the homeowner view.
 * Props:
 *  - onSelectAddress(address: string): forwarded to AddressSearch.
 */
export default function Hero({ onSelectAddress }) {
  return (
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-white to-transparent px-4 py-16 md:py-24">
      {/* Illustration */}
      <div className="w-full max-w-2xl mx-auto mb-10">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-auto"
          role="img"
          aria-label="Illustration of a house with rooftop solar panels under the sun, surrounded by rolling hills"
        >
          {/* Sky/backdrop is transparent, provided by section gradient */}

          {/* Clouds */}
          <g fill="#F3F4F6">
            <ellipse cx="140" cy="60" rx="38" ry="16" />
            <ellipse cx="170" cy="52" rx="26" ry="13" />
            <ellipse cx="660" cy="80" rx="34" ry="14" />
            <ellipse cx="690" cy="72" rx="22" ry="11" />
          </g>

          {/* Sun */}
          <g>
            <circle cx="620" cy="70" r="34" fill="#FCD34D" opacity="0.85" />
            <g stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" opacity="0.6">
              <line x1="620" y1="18" x2="620" y2="4" />
              <line x1="668" y1="70" x2="682" y2="70" />
              <line x1="654" y1="36" x2="664" y2="26" />
              <line x1="654" y1="104" x2="664" y2="114" />
            </g>
          </g>

          {/* Rolling hills */}
          <path
            d="M0 240 C 120 190, 260 260, 400 220 C 520 188, 640 240, 800 210 L 800 300 L 0 300 Z"
            fill="#DCE7DA"
          />
          <path
            d="M0 260 C 140 230, 300 280, 460 250 C 600 224, 700 262, 800 240 L 800 300 L 0 300 Z"
            fill="#C9DBC7"
          />

          {/* House */}
          <g transform="translate(300, 150)">
            {/* House body */}
            <rect x="20" y="60" width="160" height="90" fill="#E5E7EB" />
            {/* Roof plane (tilted solar roof) */}
            <polygon points="0,60 100,10 200,60" fill="#D1D5DB" />
            {/* Solar panel array on roof plane */}
            <g>
              <polygon points="18,54 100,16 130,28 55,64" fill="#2563EB" opacity="0.85" />
              {/* Panel cell grid lines */}
              <g stroke="#E5EEFC" strokeWidth="1.5" opacity="0.8">
                <line x1="18" y1="54" x2="130" y2="28" />
                <line x1="38" y1="50" x2="112" y2="21" />
                <line x1="60" y1="45" x2="94" y2="14" />
                <line x1="30" y1="60.5" x2="122" y2="34" />
                <line x1="50" y1="52" x2="50" y2="58.5" />
                <line x1="72" y1="42.5" x2="72" y2="49" />
                <line x1="95" y1="33" x2="95" y2="39" />
              </g>
            </g>
            {/* Door */}
            <rect x="90" y="105" width="24" height="45" fill="#9CA3AF" />
            {/* Window */}
            <rect x="140" y="80" width="26" height="22" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="2" />
            <rect x="35" y="80" width="26" height="22" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-6xl font-semibold text-gray-900 text-center max-w-3xl mx-auto leading-tight">
        Find your home&apos;s clean energy plan
      </h1>

      {/* Subheading */}
      <p className="mt-4 text-lg text-gray-600 text-center max-w-xl mx-auto font-normal">
        Enter your address to see your solar savings, cost, and payback — instantly.
      </p>

      {/* Search */}
      <div className="mt-8 max-w-xl mx-auto w-full">
        <AddressSearch onSelectAddress={onSelectAddress} />
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-gray-400 text-center">
        Try: 412 NW 8th Ave, Gainesville, FL — or press Enter to search.
      </p>
    </section>
  )
}
