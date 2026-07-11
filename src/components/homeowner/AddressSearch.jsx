import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { ADDRESS_SUGGESTIONS } from '../../data/mockProperties'

/**
 * AddressSearch
 * -------------
 * Props:
 *  - onSelectAddress(address: string): called when the user picks a suggestion
 *      or presses Enter with text in the input.
 *  - value (optional string): controlled input value. Defaults to internal state
 *      if not provided.
 *  - onChange (optional function(string)): called whenever the input text changes.
 */
export default function AddressSearch({ onSelectAddress, value, onChange }) {
  const [internalValue, setInternalValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const text = value !== undefined ? value : internalValue

  const suggestions = useMemo(() => {
    const query = text.trim().toLowerCase()
    if (!query) return []
    return ADDRESS_SUGGESTIONS.filter((addr) =>
      addr.toLowerCase().includes(query)
    )
  }, [text])

  function updateText(next) {
    if (onChange) onChange(next)
    if (value === undefined) setInternalValue(next)
  }

  function handleSelect(address) {
    updateText(address)
    setIsOpen(false)
    if (onSelectAddress) onSelectAddress(address)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (isOpen && suggestions.length > 0) {
        handleSelect(suggestions[0])
      } else if (text.trim()) {
        handleSelect(text.trim())
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-2">
      <div className="flex items-center gap-3 px-3 py-2">
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={text}
          placeholder="Enter your address..."
          className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          onChange={(e) => {
            updateText(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-10">
          {suggestions.map((addr) => (
            <button
              key={addr}
              type="button"
              onClick={() => handleSelect(addr)}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {addr}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
