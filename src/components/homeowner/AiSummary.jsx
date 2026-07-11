import { Sparkles } from 'lucide-react'

/**
 * AiSummary
 * ---------
 * Props:
 *  - text (string): the AI-generated summary copy to display.
 */
export default function AiSummary({ text }) {
  if (!text) return null

  return (
    <div className="bg-blue-50/30 border border-gray-200 border-l-4 border-l-blue-600 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-[13px] text-gray-500">AI-generated summary</span>
      </div>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}
