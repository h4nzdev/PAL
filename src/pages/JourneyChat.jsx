import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Mic, MicOff, PhoneOff, Phone,
  Users, MessageCircle, ChevronUp, Loader2,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'
import { supabase } from '../supabaseClient'

// ── Voice call panel ──────────────────────────────────────────────────────────

function VoiceCallPanel({ onEnd }) {
  const currentUser = useAuthStore(s => s.user)
  const [muted,    setMuted]    = useState(false)
  const [stream,   setStream]   = useState(null)
  const [denied,   setDenied]   = useState(false)
  const [duration, setDuration] = useState(0)
  const timerRef  = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(s => {
        setStream(s)
        streamRef.current = s
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      })
      .catch(() => setDenied(true))

    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !muted })
  }, [muted, stream])

  const fmt = s =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const hangUp = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    onEnd()
  }

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-sm font-semibold">Voice Call</span>
        </div>
        <p className="text-gray-600 text-xs">
          {denied ? 'Microphone denied' : stream ? fmt(duration) : 'Connecting…'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <p className="text-gray-700 text-[10px] font-medium uppercase tracking-widest mb-3">Participants</p>
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-500/20 text-emerald-400">
              {currentUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            {stream && !muted && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060d18] animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-300">
              {currentUser?.username}
              <span className="text-gray-700 text-xs ml-1.5">(you)</span>
            </p>
            <p className="text-xs text-gray-600">
              {denied ? '🚫 No mic' : muted ? '🔇 Muted' : '🎙 Live'}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex flex-col items-center gap-2 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}
        >
          <Users size={22} className="text-gray-700" />
          <p className="text-gray-600 text-xs">Waiting for others to join</p>
          <p className="text-gray-700 text-[10px]">Share the journey link to invite</p>
        </div>
      </div>

      <div className="px-5 py-5 flex-shrink-0 flex items-center justify-center gap-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setMuted(m => !m)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            muted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          {muted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          onClick={hangUp}
          className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white transition-all shadow-lg shadow-red-500/30"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe, showName }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[68%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {showName && (
          <span className="text-gray-600 text-xs px-1">{msg.senderUsername}</span>
        )}
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background: isMe ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isMe ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
            color: isMe ? '#d1fae5' : '#d1d5db',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {msg.content}
        </div>
        <span className="text-gray-700 text-[10px] px-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JourneyChat() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const journey     = useProjectStore(useShallow(s => s.journeys.find(j => j.id === id)))
  const chatId      = useProjectStore(s => s.chats[id])
  const messages    = useProjectStore(useShallow(s => s.chatMessages[chatId] || []))
  const hasMore     = useProjectStore(s => s.chatHasMore[chatId] || false)
  const { ensureChat, fetchMessages, sendMessage, addChatMessageFromRealtime } = useProjectStore()
  const currentUser = useAuthStore(s => s.user)

  const [text,         setText]         = useState('')
  const [callActive,   setCallActive]   = useState(false)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [initialising, setInitialising] = useState(true)

  const scrollRef  = useRef(null)
  const inputRef   = useRef(null)
  const atBottomRef = useRef(true)

  // ── Bootstrap: ensure chat row exists, load first page ────────────────────
  useEffect(() => {
    if (!id) return
    let cancelled = false

    ;(async () => {
      const cId = await ensureChat(id)
      if (!cancelled && cId) {
        await fetchMessages(cId)
        setInitialising(false)
      }
    })()

    return () => { cancelled = true }
  }, [id])

  // ── Real-time subscription (only once chatId is known) ────────────────────
  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        payload => {
          const m = payload.new
          addChatMessageFromRealtime(chatId, {
            id:             m.id,
            chatId:         m.chat_id,
            senderId:       m.sender_id,
            senderUsername: m.sender_username,
            content:        m.content,
            createdAt:      m.created_at,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  // ── Auto-scroll to bottom when new messages arrive ────────────────────────
  useEffect(() => {
    if (atBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  // ── Load older messages (cursor = oldest message's timestamp) ─────────────
  const loadMore = async () => {
    if (!chatId || loadingMore || !hasMore) return
    const oldest = messages[0]?.createdAt
    if (!oldest) return
    setLoadingMore(true)
    const prevHeight = scrollRef.current?.scrollHeight || 0
    await fetchMessages(chatId, oldest)
    // Restore scroll position after prepending
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight - prevHeight
    })
    setLoadingMore(false)
  }

  const send = () => {
    const trimmed = text.trim()
    if (!trimmed || !currentUser || !chatId) return
    atBottomRef.current = true
    sendMessage(chatId, currentUser.id, currentUser.username, trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!journey) {
    return (
      <div className="flex min-h-screen text-white items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Sidebar />
        <p className="text-gray-500 ml-52">Journey not found.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />

      <div className="md:ml-52 flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/journey/${id}`)}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{journey.name}</p>
                <p className="text-gray-600 text-xs">Team Chat · {messages.length} message{messages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCallActive(c => !c)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all font-medium ${
              callActive
                ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/20'
                : 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/22 hover:bg-emerald-500/18'
            }`}
          >
            {callActive ? <PhoneOff size={14} /> : <Phone size={14} />}
            {callActive ? 'End Voice Call' : 'Start Voice Call'}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Messages column */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Message list */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
            >
              {/* Load more button */}
              {hasMore && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-4 py-2 rounded-xl border border-white/8 hover:border-white/15 transition-all disabled:opacity-50"
                  >
                    {loadingMore
                      ? <><Loader2 size={12} className="animate-spin" /> Loading…</>
                      : <><ChevronUp size={12} /> Load older messages</>
                    }
                  </button>
                </div>
              )}

              {initialising ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 size={22} className="animate-spin text-emerald-500/50" />
                  <p className="text-gray-600 text-sm">Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <MessageCircle size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium">No messages yet</p>
                  <p className="text-gray-600 text-sm">Start the team conversation for <span className="text-emerald-500">{journey.name}</span></p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe     = m.senderId === currentUser?.id
                  const showName = !isMe && (i === 0 || messages[i - 1]?.senderId !== m.senderId)
                  return (
                    <MessageBubble key={m.id} msg={m} isMe={isMe} showName={showName} />
                  )
                })
              )}
            </div>

            {/* Input bar */}
            <div
              className="px-4 md:px-6 py-3 md:py-4 flex-shrink-0 pb-safe"
              style={{ borderTop: '1px solid var(--border)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Message the team… (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder:text-gray-700 focus:outline-none resize-none leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.35)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  />
                </div>
                <button
                  onClick={send}
                  disabled={!text.trim() || !chatId}
                  className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all flex-shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Voice call panel */}
          {callActive && (
            <div className="w-72 flex-shrink-0">
              <VoiceCallPanel onEnd={() => setCallActive(false)} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
