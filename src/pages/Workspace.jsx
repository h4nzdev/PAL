import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bot, MessageCircle, Users, Loader2, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import DocumentTree from '../components/Workspace/DocumentTree'
import AIChat from '../components/Workspace/AIChat'
import EditableTitle from '../components/UI/EditableTitle'
import useProjectStore from '../store/useProjectStore'
import { supabase } from '../supabaseClient'

// ── Join-via-invite gate ──────────────────────────────────────────────────────

function JoinJourneyGate({ id, navigate }) {
  const [status,  setStatus]  = useState('loading') // loading | found | notfound
  const [journey, setJourney] = useState(null)
  const [joining, setJoining] = useState(false)
  const { loadData, joinJourney } = useProjectStore()

  useEffect(() => {
    supabase
      .from('journeys')
      .select('id, name, color')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setJourney(data); setStatus('found') }
        else setStatus('notfound')
      })
  }, [id])

  const join = async () => {
    setJoining(true)
    joinJourney(id)       // persist so loadData includes it going forward
    await loadData()
    navigate(`/journey/${id}`)
  }

  return (
    <div className="flex min-h-screen text-white items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="md:ml-52 flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {status === 'loading' && (
            <>
              <Loader2 size={28} className="animate-spin text-emerald-500/50 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Looking up journey…</p>
            </>
          )}
          {status === 'notfound' && (
            <>
              <p className="text-gray-300 font-semibold mb-2">Journey not found</p>
              <p className="text-gray-600 text-sm mb-5">This link may be invalid or the journey was deleted.</p>
              <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to Dashboard</button>
            </>
          )}
          {status === 'found' && journey && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-emerald-400" />
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">You've been invited to</p>
              <p className="text-white font-bold text-xl mb-1">{journey.name}</p>
              <p className="text-gray-600 text-sm mb-6">Join this journey to view tasks, chat, and collaborate.</p>
              <button
                onClick={join}
                disabled={joining}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                {joining ? 'Joining…' : 'Join Journey'}
              </button>
              <button onClick={() => navigate('/dashboard')} className="mt-3 text-gray-600 hover:text-gray-400 text-sm w-full">
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Workspace ────────────────────────────────────────────────────────────

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(true)

  const journey      = useProjectStore(useShallow(s => s.journeys.find(j => j.id === id)))
  const nodes        = useProjectStore(useShallow(s => s.nodes[id] || []))
  const { updateJourney } = useProjectStore()

  const progress = (() => {
    const tasks = nodes.filter(n => n.type === 'task')
    if (!tasks.length) return 0
    return Math.round(tasks.filter(t => t.checked).length / tasks.length * 100)
  })()

  if (!journey) {
    return <JoinJourneyGate id={id} onJoined={() => window.location.reload()} navigate={navigate} />
  }

  return (
    <div
      className="flex h-screen text-white overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <Sidebar />
      <div className="md:ml-52 flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          {/* Title row */}
          <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <EditableTitle
                value={journey.name}
                onSave={(val) => updateJourney(id, { name: val })}
                className="text-white font-semibold text-base md:text-lg hover:text-emerald-400 transition-colors truncate"
                inputClassName="text-white font-semibold text-base md:text-lg"
                showIcon
              />
              <span
                className="text-xs text-emerald-400 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                {progress}% done
              </span>
            </div>

            {/* Desktop nav buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigate(`/journey/${id}/team`)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#d1d5db" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af" }}
              >
                <Users size={14} /> Team
              </button>
              <button
                onClick={() => navigate(`/journey/${id}/chat`)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#d1d5db" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af" }}
              >
                <MessageCircle size={14} /> Chat
              </button>
              <button
                onClick={() => setChatOpen((o) => !o)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all"
                style={
                  chatOpen
                    ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }
                    : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid transparent" }
                }
              >
                <Bot size={14} /> AI Co-Pilot
              </button>
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="flex md:hidden items-center gap-1.5 px-3 pb-3">
            <button
              onClick={() => navigate(`/journey/${id}/team`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}
            >
              <Users size={13} /> Team
            </button>
            <button
              onClick={() => navigate(`/journey/${id}/chat`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}
            >
              <MessageCircle size={13} /> Chat
            </button>
            <button
              onClick={() => setChatOpen((o) => !o)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={
                chatOpen
                  ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }
                  : { background: "rgba(255,255,255,0.05)", color: "#9ca3af" }
              }
            >
              <Bot size={13} /> AI Co-Pilot
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 md:px-6 pt-3 md:pt-6 pb-24 md:pb-6 min-w-0">
            <DocumentTree journeyId={id} />
          </div>

          {/* Desktop side panel */}
          {chatOpen && (
            <div
              className="hidden md:flex w-80 flex-shrink-0 flex-col overflow-hidden"
              style={{
                borderLeft: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(6,13,24,0.8)",
              }}
            >
              <AIChat journeyId={id} journeyName={journey.name} nodes={nodes} />
            </div>
          )}

          {/* Mobile full-screen AI Chat overlay */}
          {chatOpen && (
            <div
              className="md:hidden fixed inset-0 z-50 flex flex-col"
              style={{ background: "var(--bg-base)" }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
                <Bot size={15} className="text-emerald-400" />
                <span className="text-white text-sm font-semibold">AI Co-Pilot</span>
                <span className="ml-auto text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">Groq</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChat journeyId={id} journeyName={journey.name} nodes={nodes} hideHeader />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
