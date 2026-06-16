import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { fetchTaskAIResponse } from '../../lib/groqClient'
import Markdown from '../../lib/Markdown'
import mascot from '../../assets/mascot.png'

function getOpeningLine({ journeyCount, taskCount, doneCount, overdueCount }) {
  if (journeyCount === 0)
    return "Hey there! 👋 I'm Pal. Start your first journey and I'll help you crush it!"
  if (overdueCount > 0)
    return `Hey! You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} — want help prioritising? 🚨`
  const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0
  if (pct >= 80) return `You're ${pct}% done — absolutely killing it! 🔥 Keep going!`
  if (pct >= 50) return `Great progress — ${pct}% complete. What should we tackle next? 💪`
  if (taskCount === 0) return "You've got journeys but no tasks yet. Want me to help you plan one? 🗺️"
  return `${journeyCount} journey${journeyCount > 1 ? 's' : ''} in motion! Ask me anything about your project. 😊`
}

function buildSystemPrompt({ journeyCount, taskCount, doneCount, overdueCount, journeyNames }) {
  return `You are Pal, the friendly AI mascot of JourneyPad — a collaborative project-planning app.
Your personality: warm, encouraging, concise, occasionally uses emojis. You're like a supportive teammate.

User's current stats:
• ${journeyCount} active journey${journeyCount !== 1 ? 's' : ''}: ${journeyNames.slice(0, 3).join(', ') || 'none'}
• ${taskCount} tasks total, ${doneCount} completed (${taskCount ? Math.round(doneCount / taskCount * 100) : 0}% done)
• ${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''}

Rules:
- Be brief: 1–3 sentences max per reply.
- Be specific to their project data when relevant.
- Always end on a motivating or actionable note.
- Do NOT use markdown headers (##). Plain text only, inline bold with **word** is fine.`
}

export default function MascotAvatar({ journeys, nodes }) {
  const [open,      setOpen]      = useState(false)
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [displayed, setDisplayed] = useState({})
  const [typingId,  setTypingId]  = useState(null)

  const scrollRef   = useRef(null)
  const inputRef    = useRef(null)
  const intervalRef = useRef(null)

  const allTasks     = Object.values(nodes).flat().filter(n => n.type === 'task')
  const doneCount    = allTasks.filter(n => n.checked).length
  const today        = new Date().toISOString().slice(0, 10)
  const overdueCount = allTasks.filter(n => n.dueDate && n.dueDate < today && !n.checked).length
  const journeyNames = journeys.map(j => j.name)

  const stats = {
    journeyCount: journeys.length,
    taskCount:    allTasks.length,
    doneCount,
    overdueCount,
    journeyNames,
  }

  const openingLine = getOpeningLine(stats)

  useEffect(() => {
    if (!open || messages.length > 0) return
    const t = setTimeout(() => {
      const initMsg = { id: 'init', role: 'assistant', content: openingLine }
      setMessages([initMsg])
      setDisplayed({ init: openingLine })
    }, 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, displayed])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const startTyping = (msgId, fullText) => {
    clearInterval(intervalRef.current)
    setTypingId(msgId)
    setDisplayed(d => ({ ...d, [msgId]: '' }))
    let i = 0
    const speed = Math.max(10, Math.floor(1200 / fullText.length))
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(d => ({ ...d, [msgId]: fullText.slice(0, i) }))
      if (i >= fullText.length) { clearInterval(intervalRef.current); setTypingId(null) }
    }, speed)
  }

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setDisplayed(d => ({ ...d, [userMsg.id]: trimmed }))
    setInput('')
    setLoading(true)

    const sysPrompt  = buildSystemPrompt(stats)
    const apiHistory = updated
      .filter(m => m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const reply = await fetchTaskAIResponse(sysPrompt, apiHistory)
      const aiMsg = { id: crypto.randomUUID(), role: 'assistant', content: reply }
      setMessages(prev => [...prev, aiMsg])
      startTyping(aiMsg.id, reply)
    } catch {
      const err = { id: crypto.randomUUID(), role: 'assistant', content: 'Oops, something went wrong! Try again in a sec. 🙈' }
      setMessages(prev => [...prev, err])
      setDisplayed(d => ({ ...d, [err.id]: err.content }))
    } finally {
      setLoading(false)
    }
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="mb-6 fade-up">
      {/* ── Mascot + speech bubble row ── */}
      <div className="flex items-end gap-3">
        {/* Mascot image */}
        <div className="relative flex-shrink-0">
          <img
            src={mascot}
            alt="Pal"
            className="mascot-float w-16 h-16 md:w-20 md:h-20 object-contain select-none drop-shadow-lg"
          />
          {!open && (
            <span className="absolute top-1 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
          )}
        </div>

        {/* Speech bubble */}
        <div className="flex-1 relative min-w-0">
          {/* Triangle tail pointing left toward mascot */}
          <div
            className="absolute -left-[9px] bottom-4 w-0 h-0 pointer-events-none"
            style={{
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '9px solid rgba(255,255,255,0.08)',
            }}
          />
          <div
            className="absolute -left-[8px] bottom-4 w-0 h-0 pointer-events-none"
            style={{
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '8px solid rgba(255,255,255,0.04)',
            }}
          />

          <button
            onClick={() => setOpen(o => !o)}
            className="w-full text-left px-4 py-3 rounded-2xl rounded-tl-sm transition-all active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{openingLine}</p>
            <p className="text-emerald-500 text-xs mt-1.5 font-medium">
              {open ? 'Close chat ↑' : 'Chat with Pal →'}
            </p>
          </button>
        </div>
      </div>

      {/* ── Inline chat panel (expands below when open) ── */}
      {open && (
        <div
          className="mt-3 rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-md)',
          }}
        >
          {/* Messages */}
          <div
            ref={scrollRef}
            className="overflow-y-auto px-4 py-3 space-y-3"
            style={{ minHeight: 180, maxHeight: 260 }}
          >
            {messages.map(m => {
              const isUser   = m.role === 'user'
              const isTyping = typingId === m.id
              const text     = displayed[m.id] ?? ''
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start gap-2'}`}>
                  {!isUser && (
                    <img src={mascot} alt="" className="w-5 h-5 object-contain flex-shrink-0 mt-0.5 self-start" />
                  )}
                  <div
                    className="max-w-[85%] px-3 py-2 text-xs leading-relaxed"
                    style={{
                      background: isUser ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isUser ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      color: isUser ? '#d1fae5' : '#e2e8f0',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    }}
                  >
                    {isUser || isTyping ? (
                      <>
                        {text}
                        {isTyping && <span className="inline-block w-1 h-3 ml-0.5 bg-emerald-400 animate-pulse align-middle rounded-sm" />}
                      </>
                    ) : (
                      <Markdown className="text-xs">{m.content}</Markdown>
                    )}
                  </div>
                </div>
              )
            })}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2 items-center">
                <img src={mascot} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                <div
                  className="flex items-center gap-1 px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px 16px 16px 16px' }}
                >
                  <Loader2 size={11} className="animate-spin text-emerald-400" />
                  <span className="text-gray-500 text-xs ml-1">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="flex gap-2 px-3 py-2.5 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask Pal anything…"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-700 focus:outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 flex items-center justify-center flex-shrink-0 transition-all"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
