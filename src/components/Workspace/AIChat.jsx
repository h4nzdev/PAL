import { useState, useEffect, useRef } from 'react'
import { Bot, Send, Zap, FolderPlus, Layers } from 'lucide-react'
import { fetchGroqResponse, fetchGroqFollowUp } from '../../lib/groqClient'
import Markdown from '../../lib/Markdown'
import useProjectStore from '../../store/useProjectStore'
import useAuthStore from '../../store/useAuthStore'

const DAILY_LIMIT = 5

// ── Usage helpers ─────────────────────────────────────────────────────────────

function getUsedToday() {
  try {
    const s = localStorage.getItem('pal-ai-usage')
    if (!s) return 0
    const { count, date } = JSON.parse(s)
    return new Date().toDateString() === date ? count : 0
  } catch { return 0 }
}

function bumpUsage() {
  const today = new Date().toDateString()
  const next = getUsedToday() + 1
  localStorage.setItem('pal-ai-usage', JSON.stringify({ count: next, date: today }))
  return next
}

// ── Quick action chips ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  'Generate next phase',
  'Add a new section',
  'Break down a task',
  'Summarize progress',
]

// ── Action badge shown below a message ────────────────────────────────────────

function ActionBadge({ action }) {
  if (!action) return null
  const isJourney = action.type === 'create_journey'
  return (
    <div className={`flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg border text-xs ${
      isJourney
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
        : 'border-blue-500/25 bg-blue-500/10 text-blue-300'
    }`}>
      {isJourney ? <FolderPlus size={11} /> : <Layers size={11} />}
      <span>
        {isJourney
          ? `Journey "${action.name}" created`
          : `Section "${action.name}" added to journey`}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIChat({ journeyId, journeyName, nodes }) {
  const { addNode, updateNode, createJourney } = useProjectStore()
  const user = useAuthStore(s => s.user)

  const [messages, setMessages] = useState([{
    id:      'init',
    role:    'assistant',
    content: `Hi! I'm your AI co-pilot for **${journeyName}**. Ask me anything — I can also create sections or new journeys for you.`,
    action:  null,
  }])

  const apiCtxRef = useRef([])   // multi-turn context for Groq (no system msg)
  const typingRef = useRef(null)
  const scrollRef = useRef(null)

  const [input,     setInput]     = useState('')
  const [fetching,  setFetching]  = useState(false)
  const [animText,  setAnimText]  = useState(null)   // null = idle, string = revealing
  const [usedToday, setUsedToday] = useState(getUsedToday)

  const remaining = DAILY_LIMIT - usedToday
  const atLimit   = remaining <= 0
  const busy      = fetching || animText !== null

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, animText, fetching])

  // Cleanup on unmount
  useEffect(() => () => clearInterval(typingRef.current), [])

  function startTyping(text, msgObj) {
    setAnimText('')
    let i = 0
    // Aim for ~1.5s total reveal, min 7ms per char
    const speed = Math.max(7, Math.floor(1500 / Math.max(1, text.length)))
    typingRef.current = setInterval(() => {
      i++
      if (i >= text.length) {
        clearInterval(typingRef.current)
        setAnimText(null)
        setMessages(m => [...m, msgObj])
      } else {
        setAnimText(text.substring(0, i))
      }
    }, speed)
  }

  function buildSystemPrompt() {
    const taskCount = nodes.filter(n => n.type === 'task').length
    const doneCount = nodes.filter(n => n.type === 'task' && n.checked).length
    const sections  = nodes.filter(n => n.type === 'header').map(n => n.content)
    return `You are an AI project co-pilot for the journey "${journeyName}".
Stats: ${taskCount} tasks total, ${doneCount} completed.
Sections: ${sections.length ? sections.join(', ') : 'none yet'}.
Tools available: create_section (add a phase/section to THIS journey), create_journey (start a brand-new project).
Call a tool only when the user clearly requests creating a section or a new project.
Keep responses concise — 1 to 3 sentences.`
  }

  async function send() {
    if (!input.trim() || busy || atLimit) return

    const userText = input.trim()
    setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', content: userText, action: null }])
    setInput('')
    setUsedToday(bumpUsage())

    const apiMessages = [
      { role: 'system', content: buildSystemPrompt() },
      ...apiCtxRef.current,
      { role: 'user', content: userText },
    ]

    setFetching(true)

    try {
      const result = await fetchGroqResponse(apiMessages)
      setFetching(false)

      let responseText = result.content
      let action       = null

      if (result.toolCalls.length > 0) {
        const call = result.toolCalls[0]
        let args
        try { args = JSON.parse(call.function.arguments) } catch { args = {} }

        const toolResult = await handleToolCall(call.function.name, args, call.id, apiMessages, result.rawMessage)
        responseText = toolResult.text
        action       = toolResult.action
      }

      if (!responseText) responseText = 'Done! Let me know if you need anything else.'

      // Update rolling context (simplified — just user + final assistant text)
      apiCtxRef.current = [
        ...apiCtxRef.current,
        { role: 'user',      content: userText },
        { role: 'assistant', content: responseText },
      ]

      const msgObj = { id: crypto.randomUUID(), role: 'assistant', content: responseText, action }
      startTyping(responseText, msgObj)

    } catch (err) {
      setFetching(false)
      console.error(err)
      const errText = 'Sorry, something went wrong. Please try again.'
      startTyping(errText, { id: crypto.randomUUID(), role: 'assistant', content: errText, action: null })
    }
  }

  async function handleToolCall(name, args, callId, apiMessages, rawMsg) {
    const followUpBase = [
      ...apiMessages,
      rawMsg,
      { role: 'tool', tool_call_id: callId, content: '' },
    ]

    if (name === 'create_section') {
      const sectionNode = addNode(journeyId, null, 'header', args.name || 'New Section')
      if (args.description && sectionNode?.id) {
        updateNode(journeyId, sectionNode.id, { description: args.description })
      }
      followUpBase[followUpBase.length - 1].content = `Section "${args.name}" created.`
      const text = await fetchGroqFollowUp(followUpBase)
      return {
        text:   text || `Done! "${args.name}" has been added as a new section.`,
        action: { type: 'create_section', name: args.name || 'New Section' },
      }
    }

    if (name === 'create_journey') {
      const newId = createJourney(args.name || 'New Journey', user?.id)
      followUpBase[followUpBase.length - 1].content = `Journey "${args.name}" created (id: ${newId}).`
      const text = await fetchGroqFollowUp(followUpBase)
      return {
        text:   text || `Done! A new journey called "${args.name}" has been created. Find it in your Dashboard.`,
        action: { type: 'create_journey', name: args.name || 'New Journey', id: newId },
      }
    }

    return { text: '', action: null }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
        <Bot size={15} className="text-emerald-400" />
        <span className="text-white text-sm font-medium">AI Co-Pilot</span>
        <span className="ml-auto text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">Groq</span>
      </div>

      {/* Daily usage bar */}
      <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-5 rounded-full transition-all ${
                i < usedToday ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs ${atLimit ? 'text-red-400' : 'text-gray-600'}`}>
          {atLimit ? 'Limit reached' : `${remaining} / ${DAILY_LIMIT} left`}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`rounded-xl p-3 ${
              m.role === 'assistant'
                ? 'bg-white/5 text-gray-200 max-w-full'
                : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/20 max-w-[90%] text-sm leading-relaxed'
            }`}>
              {m.role === 'assistant'
                ? <Markdown>{m.content}</Markdown>
                : m.content
              }
              {m.action && <ActionBadge action={m.action} />}
            </div>
          </div>
        ))}

        {/* Typing reveal bubble — plain text while animating, no partial markdown */}
        {animText !== null && (
          <div>
            <div className="rounded-xl p-3 text-sm leading-relaxed bg-white/5 text-gray-200 max-w-full whitespace-pre-wrap">
              {animText}
              <span className="inline-block w-[2px] h-3.5 ml-0.5 bg-emerald-400 animate-pulse align-middle rounded-full" />
            </div>
          </div>
        )}

        {/* Fetching dots */}
        {fetching && (
          <div>
            <div className="rounded-xl px-4 py-3 bg-white/5 flex items-center gap-1.5 w-fit">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 border-t border-white/5 flex flex-wrap gap-1.5 flex-shrink-0">
        {QUICK_ACTIONS.map(qa => (
          <button
            key={qa}
            onClick={() => setInput(qa)}
            disabled={busy || atLimit}
            className="text-xs bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400 hover:text-white px-2.5 py-1 rounded-full transition-all flex items-center gap-1"
          >
            <Zap size={10} /> {qa}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-white/5 flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={atLimit
            ? 'Daily limit reached — come back tomorrow'
            : 'Ask anything about this journey…'}
          disabled={busy || atLimit}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 disabled:opacity-40"
        />
        <button
          onClick={send}
          disabled={busy || atLimit || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
