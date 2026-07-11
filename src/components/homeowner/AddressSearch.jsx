import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY
const DEBOUNCE_MS = 250

/**
 * Real, nationwide (US) address autocomplete via Google Places API (New) —
 * `places:autocomplete`. Requires Places API (New) enabled + a key valid for
 * browser use (this call is designed to run client-side, unlike server/curl
 * testing which a referrer-restricted key will reject).
 */
async function fetchAddressSuggestions(input, signal) {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['us'],
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
    }),
  })
  if (!res.ok) throw new Error(`Places autocomplete ${res.status}`)
  const data = await res.json()
  return (data.suggestions || [])
    .map((s) => ({ text: s.placePrediction?.text?.text, placeId: s.placePrediction?.placeId }))
    .filter((s) => s.text)
}

/** Resolves a place's lat/lng via Places API (New) Place Details. */
async function fetchPlaceLocation(placeId, signal) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    signal,
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'location',
    },
  })
  if (!res.ok) throw new Error(`Place details ${res.status}`)
  const data = await res.json()
  if (!data.location) return null
  return { lat: data.location.latitude, lng: data.location.longitude }
}

/**
 * AddressSearch
 * -------------
 * Props:
 *  - onSelectAddress(address: string): called when the user picks a suggestion
 *      or presses Enter with text in the input. Works for any US address —
 *      there is no fixed/hardcoded address list.
 *  - value (optional string): controlled input value. Defaults to internal state
 *      if not provided.
 *  - onChange (optional function(string)): called whenever the input text changes.
 *  - onCoordinates (optional function({lat, lng}, text)): fired as suggestions
 *      resolve, with the top suggestion's coordinates. Used to drive live map
 *      zoom previews; safe to omit.
 */
export default function AddressSearch({ onSelectAddress, value, onChange, onCoordinates }) {
  const [internalValue, setInternalValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  const text = value !== undefined ? value : internalValue
  const canAutocomplete = Boolean(GOOGLE_API_KEY)

  useEffect(() => {
    setActiveIndex(-1)

    if (!canAutocomplete) return
    const query = text.trim()
    if (query.length < 4) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller
      setLoadingSuggestions(true)

      fetchAddressSuggestions(query, controller.signal)
        .then((results) => {
          setSuggestions(results)
          const top = results[0]
          if (onCoordinates && top?.placeId) {
            fetchPlaceLocation(top.placeId, controller.signal)
              .then((location) => location && onCoordinates(location, top.text))
              .catch(() => {})
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('[SolarScope] Address autocomplete unavailable:', err.message)
            setSuggestions([])
          }
        })
        .finally(() => setLoadingSuggestions(false))
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, canAutocomplete])

  function updateText(next) {
    if (onChange) onChange(next)
    if (value === undefined) setInternalValue(next)
  }

  function handleSelect(address, placeId) {
    updateText(address)
    setIsOpen(false)
    setActiveIndex(-1)
    setSuggestions([])
    if (onCoordinates && placeId) {
      fetchPlaceLocation(placeId)
        .then((location) => location && onCoordinates(location, address))
        .catch(() => {})
    }
    if (onSelectAddress) onSelectAddress(address)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      if (isOpen && suggestions.length > 0) {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
      }
    } else if (e.key === 'ArrowUp') {
      if (isOpen && suggestions.length > 0) {
        e.preventDefault()
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      }
    } else if (e.key === 'Enter') {
      if (isOpen && suggestions.length > 0) {
        const chosen = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0]
        handleSelect(chosen.text, chosen.placeId)
      } else if (text.trim()) {
        // No suggestions available (no key, API unavailable, or a full address
        // was typed directly) — search whatever the user typed. Never dead-ends.
        handleSelect(text.trim())
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative w-full h-16 flex items-center gap-2 bg-white border border-slate-200 rounded-full shadow-lg shadow-slate-200/60 pl-5 pr-2 transition-all duration-150 focus-within:ring-2 focus-within:ring-blue-600 focus-within:shadow-xl">
      <Search className="w-5 h-5 text-gray-400 shrink-0" />
      <input
        type="text"
        value={text}
        placeholder="Enter any U.S. address"
        className="w-full h-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
        onChange={(e) => {
          updateText(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-autocomplete="list"
      />
      {loadingSuggestions && (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin text-gray-400" />
      )}
      <button
        type="button"
        onClick={() => text.trim() && handleSelect(text.trim())}
        disabled={!text.trim()}
        className="shrink-0 h-12 px-6 rounded-full bg-blue-600 text-white text-sm font-medium transition-all duration-150 ease-snappy hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Analyze
      </button>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-10">
          {suggestions.map((s, index) => (
            <button
              key={s.text}
              type="button"
              // Prevent the input's onBlur from firing (and closing the list)
              // before this click is registered, without relying solely on
              // the blur timeout.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.text, s.placeId)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full text-left px-4 py-3 text-gray-700 transition-colors duration-150 ${
                index === activeIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              {s.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
