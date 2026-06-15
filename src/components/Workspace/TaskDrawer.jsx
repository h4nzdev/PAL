import { useState, useEffect, useRef } from 'react'
import {
  X,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  FileText,
  GitBranch,
  ImageIcon,
  Trash2,
  Upload,
  ExternalLink,
  Eye,
  Users,
  Bot,
  Send,
  Video,
  Clock,
  Sparkles,
  Loader2,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { fetchTaskAIResponse } from '../../lib/groqClient'
import Markdown from '../../lib/Markdown'
import { useShallow } from 'zustand/react/shallow'
import useProjectStore from '../../store/useProjectStore'
import useAuthStore from '../../store/useAuthStore'
import { toast } from 'sonner'
import CallModal from './CallModal'
import FlowchartEditor from './FlowchartEditor'
import { useJourneyRole, canEdit, canUpload } from '../../lib/useJourneyRole'

// ─── Attachment block ─────────────────────────────────────────────────────────

function AttachmentBlock({ attachments = [], onAdd, onRemove, onPreview }) {
  const fileRef = useRef(null);

  return (
    <div className="space-y-4">
      {onAdd ? (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-all group"
            style={{ border: "2px dashed rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
              e.currentTarget.style.background = "rgba(16,185,129,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Upload
              size={22}
              className="text-gray-600 group-hover:text-emerald-400 transition-colors"
            />
            <span className="text-gray-400 text-sm">
              Click to upload images
            </span>
            <span className="text-gray-600 text-xs">PNG, JPG, GIF, WebP</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onAdd}
            className="hidden"
          />
        </>
      ) : (
        <p className="text-gray-700 text-xs text-center py-2">
          You don't have permission to upload files.
        </p>
      )}

      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                src={att.dataUrl}
                alt={att.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "rgba(0,0,0,0.65)" }}
              >
                <button
                  onClick={() => onPreview?.(att)}
                  className="p-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all"
                >
                  <Eye size={13} />
                </button>
                <a
                  href={att.dataUrl}
                  target="_blank"
                  rel="noopener"
                  className="p-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all"
                >
                  <ExternalLink size={13} />
                </a>
                {onRemove && (
                  <button
                    onClick={() => onRemove(att.id)}
                    className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                }}
              >
                <p className="text-white text-[10px] truncate">{att.name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-700 text-sm py-4">
          No attachments yet.
        </p>
      )}
    </div>
  );
}

// ─── People tab ───────────────────────────────────────────────────────────────

function PeopleTab({ node, journeyId, assignee, setAssignee, onCall, editable }) {
  const currentUser = useAuthStore(s => s.user)
  const { updateNode, addActivity } = useProjectStore()
  const [assignInput, setAssignInput] = useState('')
  const [copied,      setCopied]      = useState(false)

  const doAssign = (username) => {
    const trimmed = username.trim()
    if (!trimmed) return
    const next = assignee === trimmed ? null : trimmed
    setAssignee(next || '')
    updateNode(journeyId, node.id, { assignedTo: next })
    setAssignInput('')
    if (next) {
      addActivity(journeyId, currentUser?.username || 'Someone',
        `[task:${node.id}] assigned to @${next} — "${node.content}"`)
      toast.success(`Task assigned to @${next}`)
    } else {
      addActivity(journeyId, currentUser?.username || 'Someone',
        `[task:${node.id}] unassigned from @${trimmed} — "${node.content}"`)
      toast(`Assignment removed from @${trimmed}`)
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(journeyId).then(() => {
      setCopied(true)
      toast.success('Invite code copied!')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Assignment status header ── */}
      <div
        className={`flex items-center gap-3 rounded-xl p-3.5 transition-all ${
          assignee
            ? 'border border-emerald-500/25 bg-emerald-500/5'
            : 'border border-white/8 bg-white/[0.02]'
        }`}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
          style={{
            background: assignee ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.07)',
            color: assignee ? '#34d399' : '#6b7280',
          }}
        >
          {assignee ? assignee[0].toUpperCase() : <User size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          {assignee ? (
            <>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Assigned to</p>
              <p className="text-sm font-semibold text-emerald-400">@{assignee}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">No assignee</p>
              <p className="text-[10px] text-gray-700">Enter a username below to assign</p>
            </>
          )}
        </div>
        {assignee && editable && (
          <button
            onClick={() => doAssign(assignee)}
            className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/15 flex-shrink-0"
          >
            Remove
          </button>
        )}
      </div>

      {/* ── Assign by username — editors only ── */}
      {editable && (
        <div>
          <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-2">Assign Task</p>
          <div className="flex gap-2">
            <input
              value={assignInput}
              onChange={e => setAssignInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doAssign(assignInput) }}
              placeholder="Enter teammate username…"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
            <button
              onClick={() => doAssign(assignInput)}
              disabled={!assignInput.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              Assign
            </button>
          </div>
          <p className="text-gray-700 text-[10px] mt-1.5">Teammates must have an account to be assigned.</p>
        </div>
      )}

      {/* ── Invite code ── */}
      <div>
        <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-2">Invite Teammates</p>
        <div
          className="rounded-xl p-3.5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-600 flex-shrink-0" />
            <p className="text-gray-400 text-xs">Share this code — teammates enter it on the dashboard to join.</p>
          </div>
          <div
            className="rounded-lg px-3 py-2.5 text-gray-300 text-xs font-mono truncate select-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {journeyId}
          </div>
          <button
            onClick={copyInviteCode}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35'
                : 'bg-white/5 text-gray-300 hover:bg-white/8 border border-white/8 hover:border-white/15'
            }`}
          >
            {copied ? '✓ Code copied!' : 'Copy Invite Code'}
          </button>
        </div>
        <p className="text-gray-700 text-[10px] mt-1.5">Recipients need to create an account to join.</p>
      </div>

      {/* ── Start call ── */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest">Voice Call</p>
        <button
          onClick={onCall}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <Video size={12} /> Start Call
        </button>
      </div>

    </div>
  )
}

// ─── Task AI tab ──────────────────────────────────────────────────────────────

const CTX_KEY = (journeyId) => `pal-ctx-${journeyId}`

const QUICK_ACTIONS = [
  { label: 'Generate Prompt', icon: Sparkles, prompt: 'Generate a detailed, ready-to-use AI prompt I can copy and paste to work on this task. Wrap the prompt itself in a markdown code block.' },
  { label: 'Break it down',   icon: GitBranch, prompt: 'Break this task into small, actionable subtasks I can complete one by one.' },
  { label: 'Write a plan',    icon: FileText,  prompt: 'Write a concise step-by-step action plan for completing this task.' },
]

function buildSystemPrompt(journeyName, projectCtx, node) {
  return `You are an AI co-pilot inside JourneyPad, a project planning app.

Project: "${journeyName}"
${projectCtx ? `Project context:\n${projectCtx}` : ''}

The user is working on this specific task:
• Title: "${node.content}"${node.description ? `\n• Notes: ${node.description}` : ''}${node.assignedTo ? `\n• Assigned to: @${node.assignedTo}` : ''}${node.dueDate ? `\n• Due: ${node.dueDate}` : ''}

You help the user understand, plan, and execute this task. You can also generate detailed prompts they can reuse elsewhere. Be concise and practical. Wrap code or reusable prompts in markdown code blocks.`
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-emerald-400 transition-colors mt-1.5">
      {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  )
}

function TaskAI({ node, journeyId, journeyName }) {
  const ctxKey        = CTX_KEY(journeyId)
  const [projectCtx,  setProjectCtx]  = useState(() => localStorage.getItem(ctxKey) || '')
  const [setupText,   setSetupText]   = useState('')
  const [messages,    setMessages]    = useState([])  // { id, role, content, typing? }
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [typingId,    setTypingId]    = useState(null)
  const [displayed,   setDisplayed]   = useState({})  // { [msgId]: string }
  const fileRef    = useRef(null)
  const scrollRef  = useRef(null)
  const intervalRef = useRef(null)

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, displayed])

  const startTyping = (msgId, fullText) => {
    clearInterval(intervalRef.current)
    setTypingId(msgId)
    setDisplayed(d => ({ ...d, [msgId]: '' }))
    let i = 0
    const speed = Math.max(8, Math.floor(1500 / fullText.length))
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(d => ({ ...d, [msgId]: fullText.slice(0, i) }))
      if (i >= fullText.length) {
        clearInterval(intervalRef.current)
        setTypingId(null)
      }
    }, speed)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const sendToAI = async (userText, conversationSoFar) => {
    const sysPrompt = buildSystemPrompt(journeyName, projectCtx, node)
    const apiMessages = [
      ...conversationSoFar.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ]
    setLoading(true)
    try {
      const reply = await fetchTaskAIResponse(sysPrompt, apiMessages)
      const aiMsg = { id: crypto.randomUUID(), role: 'assistant', content: reply }
      setMessages(prev => [...prev, aiMsg])
      startTyping(aiMsg.id, reply)
    } catch (err) {
      const errMsg = { id: crypto.randomUUID(), role: 'assistant', content: `⚠ ${err.message}` }
      setMessages(prev => [...prev, errMsg])
      setDisplayed(d => ({ ...d, [errMsg.id]: errMsg.content }))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    await sendToAI(trimmed, messages)
  }

  const handleQuickAction = async (prompt) => {
    if (loading) return
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: prompt }
    const next = [...messages, userMsg]
    setMessages(next)
    await sendToAI(prompt, messages)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result?.slice(0, 6000) // cap at 6k chars
      localStorage.setItem(ctxKey, text)
      setProjectCtx(text)
    }
    reader.readAsText(file)
  }

  const handleSetContext = () => {
    const trimmed = setupText.trim()
    if (!trimmed) return
    localStorage.setItem(ctxKey, trimmed)
    setProjectCtx(trimmed)
  }

  const resetContext = () => {
    localStorage.removeItem(ctxKey)
    setProjectCtx('')
    setMessages([])
    setDisplayed({})
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!projectCtx) {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <Bot size={15} className="text-violet-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Set up AI context</p>
            <p className="text-gray-600 text-xs">Helps the AI understand your project</p>
          </div>
        </div>

        {/* File upload option */}
        <div>
          <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-2">Option A — Upload a file</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl py-6 flex flex-col items-center gap-2 transition-all"
            style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.background = 'rgba(139,92,246,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          >
            <Upload size={20} className="text-gray-600" />
            <span className="text-gray-400 text-sm">CLAUDE.md, README, or any .txt / .md</span>
            <span className="text-gray-700 text-xs">First 6,000 characters used as context</span>
          </button>
          <input ref={fileRef} type="file" accept=".md,.txt,.markdown" onChange={handleFileUpload} className="hidden" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-gray-700 text-xs">or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Text description option */}
        <div>
          <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-2">Option B — Describe your project</p>
          <textarea
            value={setupText}
            onChange={e => setSetupText(e.target.value)}
            placeholder="e.g. We're building a SaaS dashboard for real-estate agents. Tech stack: React, Supabase, Tailwind. The goal is to help agents manage leads and property listings..."
            rows={5}
            className="w-full rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none resize-none placeholder:text-gray-700 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={handleSetContext}
            disabled={!setupText.trim()}
            className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.35)' }}
          >
            Set Context & Start Chatting
          </button>
        </div>
        <p className="text-gray-700 text-xs text-center">Context is saved per journey in your browser.</p>
      </div>
    )
  }

  // ── AI chat screen ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Context badge + reset */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(139,92,246,0.05)' }}
      >
        <Bot size={11} className="text-violet-400 flex-shrink-0" />
        <span className="text-violet-400 text-[10px] flex-1 truncate">
          Context: {projectCtx.slice(0, 60)}{projectCtx.length > 60 ? '…' : ''}
        </span>
        <button onClick={resetContext} title="Reset context" className="text-gray-700 hover:text-violet-400 transition-colors flex-shrink-0">
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Quick action chips */}
      <div className="flex gap-2 px-4 py-2.5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
          <button
            key={label}
            onClick={() => handleQuickAction(prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Icon size={10} /> {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Bot size={22} className="text-violet-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium">AI co-pilot ready</p>
            <p className="text-gray-700 text-xs">Ask anything about this task, or use a quick action above.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isUser   = msg.role === 'user'
          const isTyping = typingId === msg.id
          // During animation: show partial raw text; after: render full markdown
          const rawText  = isUser ? msg.content : (displayed[msg.id] ?? '')
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.28)' }}>
                  <Bot size={11} className="text-violet-400" />
                </div>
              )}
              <div className={`max-w-[85%] flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className="px-3.5 py-2.5"
                  style={{
                    background: isUser ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.09)',
                    border: `1px solid ${isUser ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.18)'}`,
                    color: isUser ? '#d1fae5' : '#e2e8f0',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  }}
                >
                  {isUser || isTyping ? (
                    <span className="text-xs leading-relaxed whitespace-pre-wrap">
                      {rawText}
                      {isTyping && <span className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm bg-violet-400 animate-pulse align-middle" />}
                    </span>
                  ) : (
                    <Markdown className="text-xs">{msg.content}</Markdown>
                  )}
                </div>
                {!isUser && !isTyping && rawText && <CopyButton text={msg.content} />}
              </div>
            </div>
          )
        })}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.28)' }}>
              <Bot size={11} className="text-violet-400" />
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl" style={{ background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <Loader2 size={12} className="text-violet-400 animate-spin" />
              <span className="text-violet-400 text-xs">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask about this task… (Enter to send)"
            rows={2}
            disabled={loading}
            className="flex-1 rounded-xl px-3 py-2.5 text-gray-200 text-xs focus:outline-none resize-none placeholder:text-gray-700 leading-relaxed disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.35)' }}
          >
            <Send size={14} className="text-violet-400" />
          </button>
        </div>
      </div>
    </>
  )
}

// ─── History tab ─────────────────────────────────────────────────────────────

function HistoryTab({ nodeId, activities }) {
  const events = activities
    .filter(a => a.action?.includes(`[task:${nodeId}]`))
    .map(a => ({
      ...a,
      // Strip the internal tag from the display text
      display: a.action.replace(`[task:${nodeId}] `, ''),
    }))

  const fmt = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    if (diffMs < 60000) return 'just now'
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-1">
      <p className="text-gray-700 text-[10px] font-medium uppercase tracking-widest mb-4">Task History</p>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Clock size={28} className="text-gray-700" />
          <p className="text-gray-500 text-sm">No history yet</p>
          <p className="text-gray-700 text-xs">Changes like completing, renaming, or assigning will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/8" />

          <div className="space-y-0">
            {events.map((ev, i) => (
              <div key={ev.id || i} className="relative flex gap-4 pl-8 pb-5">
                {/* Dot */}
                <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-emerald-500/50 bg-[#0c1220] flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0 -mt-0.5">
                  <p className="text-gray-400 text-xs font-medium leading-snug">{ev.username}</p>
                  <p className="text-gray-300 text-xs mt-0.5 leading-relaxed">{ev.display}</p>
                  <p className="text-gray-700 text-[10px] mt-1">{fmt(ev.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'notes',   label: 'Notes',     icon: FileText  },
  { key: 'diagram', label: 'Flowchart', icon: GitBranch },
  { key: 'files',   label: 'Files',     icon: ImageIcon },
  { key: 'people',  label: 'People',    icon: Users     },
  { key: 'ai',      label: 'AI',        icon: Bot       },
  { key: 'history', label: 'History',   icon: Clock     },
]

// ─── Main drawer ──────────────────────────────────────────────────────────────

export default function TaskDrawer({ node, journeyId, journeyName, onClose }) {
  const { updateNode, deleteNode, addActivity } = useProjectStore()
  const currentUser = useAuthStore(s => s.user)
  const activities  = useProjectStore(useShallow(s => s.activities))
  const role        = useJourneyRole(journeyId)
  const editable    = canEdit(role)
  const uploadable  = canUpload(role)

  const [tab,          setTab]          = useState('notes')
  const [callOpen,     setCallOpen]     = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false)
  const [title,        setTitle]        = useState(node.content)
  const [assignee,     setAssignee]     = useState(node.assignedTo || '')
  const [dueDate,      setDueDate]      = useState(node.dueDate || '')
  const [notes,        setNotes]        = useState(node.description || '')

  useEffect(() => { if (!editingTitle) setTitle(node.content) }, [node.content, editingTitle])

  // Sync external assignedTo changes (e.g. from People tab direct updateNode)
  useEffect(() => { setAssignee(node.assignedTo || '') }, [node.assignedTo])

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else if (!callOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, callOpen, previewImage]);

  const saveTitle = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== node.content) {
      updateNode(journeyId, node.id, { content: trimmed })
      addActivity(journeyId, currentUser?.username || 'Someone', `[task:${node.id}] renamed to "${trimmed}"`)
    }
    setEditingTitle(false)
  }

  const saveMeta    = () => updateNode(journeyId, node.id, { assignedTo: assignee.trim() || null, dueDate: dueDate || null })
  const saveNotes   = () => updateNode(journeyId, node.id, { description: notes })
  const saveDiagram = (json) => updateNode(journeyId, node.id, { diagram: json })

  const toggleCheck = () => {
    const nowChecked = !node.checked
    updateNode(journeyId, node.id, { checked: nowChecked })
    addActivity(journeyId, currentUser?.username || 'Someone',
      `[task:${node.id}] ${nowChecked ? 'completed' : 'reopened'} "${node.content}"`)
  }

  const handleImageAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        const next = [...(node.attachments || []), { id: crypto.randomUUID(), name: file.name, dataUrl: evt.target.result }]
        updateNode(journeyId, node.id, { attachments: next })
        toast.success('Image attached.')
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageRemove = (attId) => {
    updateNode(journeyId, node.id, { attachments: (node.attachments || []).filter(a => a.id !== attId) })
  }

  const handleDelete = () => {
    deleteNode(journeyId, node.id)
    onClose()
    toast.error('Task deleted.')
  }

  const attachCount = node.attachments?.length || 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col shadow-2xl"
        style={{
          width: 520,
          background: "#0c1220",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={toggleCheck}
              disabled={!editable}
              className="flex-shrink-0 mt-1 transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {node.checked ? (
                <CheckCircle2 size={20} className="text-emerald-400" />
              ) : (
                <Circle
                  size={20}
                  className="text-gray-600 hover:text-emerald-400 transition-colors"
                />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="w-full bg-transparent text-white font-semibold text-lg focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => editable && setEditingTitle(true)}
                  className={`font-semibold text-lg leading-snug ${node.checked ? "line-through text-gray-500" : "text-white"} ${editable ? "cursor-text hover:text-emerald-400 transition-colors" : "cursor-default"}`}
                  title={editable ? "Click to rename" : undefined}
                >
                  {node.content}
                </h2>
              )}
              <p className="text-gray-700 text-[11px] mt-0.5">
                Click title to rename · Esc to close
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-1"
            >
              <X size={17} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex gap-2 mt-3 ml-8">
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 flex-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <User size={11} className="text-gray-500 flex-shrink-0" />
              <input
                value={assignee}
                onChange={(e) => editable && setAssignee(e.target.value)}
                onBlur={editable ? saveMeta : undefined}
                readOnly={!editable}
                placeholder="Assignee"
                className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-700 w-full read-only:cursor-default"
              />
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 flex-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Calendar size={11} className="text-gray-500 flex-shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={
                  editable
                    ? (e) => {
                        setDueDate(e.target.value);
                        updateNode(journeyId, node.id, {
                          dueDate: e.target.value || null,
                        });
                      }
                    : undefined
                }
                readOnly={!editable}
                className="bg-transparent text-white text-xs focus:outline-none w-full read-only:cursor-default"
              />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex px-4 flex-shrink-0 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 -mb-px transition-all whitespace-nowrap flex-shrink-0 ${
                tab === key
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-gray-600 hover:text-gray-300"
              }`}
            >
              <Icon size={11} />
              {label}
              {key === "files" && attachCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "#34d399",
                  }}
                >
                  {attachCount}
                </span>
              )}
              {key === "ai" && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    color: "#a78bfa",
                  }}
                >
                  ✦
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === "notes" && (
            <div className="flex-1 overflow-y-auto p-5">
              <label className="text-gray-500 text-xs block mb-2">
                Notes & Description
              </label>
              <textarea
                value={notes}
                onChange={(e) => editable && setNotes(e.target.value)}
                readOnly={!editable}
                placeholder={
                  editable
                    ? "Add notes, acceptance criteria, links, context…"
                    : "No notes."
                }
                rows={14}
                className="w-full rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none resize-none leading-relaxed placeholder:text-gray-700 read-only:cursor-default"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => {
                  if (editable)
                    e.target.style.borderColor = "rgba(16,185,129,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.07)";
                  if (editable) saveNotes();
                }}
              />
              {editable && (
                <p className="text-gray-700 text-xs mt-2">
                  Saved automatically on blur.
                </p>
              )}
            </div>
          )}

          {tab === "diagram" && (
            <div className="flex-1 overflow-hidden p-4">
              <FlowchartEditor diagram={node.diagram} onSave={saveDiagram} />
            </div>
          )}

          {tab === "files" && (
            <div className="flex-1 overflow-y-auto p-5">
              <AttachmentBlock
                attachments={node.attachments || []}
                onAdd={uploadable ? handleImageAdd : null}
                onRemove={editable ? handleImageRemove : null}
                onPreview={setPreviewImage}
              />
            </div>
          )}

          {tab === "people" && (
            <div className="flex-1 overflow-y-auto p-5">
              <PeopleTab
                node={node}
                journeyId={journeyId}
                assignee={assignee}
                setAssignee={setAssignee}
                onCall={() => setCallOpen(true)}
                editable={editable}
              />
            </div>
          )}

          {tab === "ai" && (
            <TaskAI
              node={node}
              journeyId={journeyId}
              journeyName={journeyName}
            />
          )}

          {tab === "history" && (
            <div className="flex-1 overflow-y-auto p-5">
              <HistoryTab nodeId={node.id} activities={activities} />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-gray-700 text-[11px] font-mono">
            #{node.id.slice(0, 8)}
          </span>
          {editable ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/8"
            >
              <Trash2 size={12} /> Delete task
            </button>
          ) : (
            <span className="text-gray-700 text-[11px]">View only</span>
          )}
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setPreviewImage(null)}
          />
          <div className="relative z-10 max-w-[90vw] max-h-[90vh] rounded-3xl overflow-hidden bg-[#0c1220] border border-white/10 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-white/10 transition-all"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage.dataUrl}
              alt={previewImage.name}
              className="max-w-[90vw] max-h-[90vh] object-contain block"
            />
            <div className="px-4 py-3 bg-black/70 text-white text-xs text-center">
              {previewImage.name}
            </div>
          </div>
        </div>
      )}
      {callOpen && (
        <CallModal
          onClose={() => setCallOpen(false)}
          taskTitle={node.content}
          taskId={node.id}
        />
      )}
    </>
  );
}
