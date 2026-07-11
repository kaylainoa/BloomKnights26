import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'
import { askChatQuestion } from '../../services/api'

/**
 * ChatWidget
 * ----------
 * Floating chat bubble for the homeowner view. Clicking it opens a small panel where the
 * user can ask free-form questions about solar, answered by Gemini (see askChatQuestion in
 * services/api.js), grounded in their live analysis when one exists.
 * Props:
 *  - analysis: the current homeowner analysis object, or null before a search. Passed straight
 *      through to askChatQuestion so answers can reference the user's own numbers.
 */
export default function ChatWidget({ analysis }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // [{ role: 'user' | 'model', text }]
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, open])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    const reply = await askChatQuestion(nextMessages, analysis)
    setMessages((prev) => [...prev, { role: 'model', text: reply }])
    setLoading(false)
  }

  return (
    <>
      {open && (
        <div className="animate-fade-slide-in fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-100" />
              <div>
                <p className="text-sm font-semibold text-white">Ask about solar</p>
                <p className="text-xs text-blue-100">Powered by Gemini</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-blue-100 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">
                Ask me anything about solar — costs, savings, how panels work, or
                {analysis ? " your results above." : ' what to expect.'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-3 py-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a question…"
              className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
        aria-label={open ? 'Close chat' : 'Ask about solar'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
