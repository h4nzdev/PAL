import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bot, MessageCircle, Users, Loader2, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { COLOR_HEX } from '../lib/colors'
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

// ── Workspace skeleton ────────────────────────────────────────────────────────

function Sk({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/6 ${className}`} />
}

function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="md:ml-52 flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex-shrink-0 px-3 md:px-6 py-3 md:py-4 gap-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <Sk className="md:hidden w-2.5 h-2.5 rounded-full" />
            <Sk className="h-6 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Sk className="h-6 w-14 rounded-full" />
            <div className="hidden md:flex gap-1.5">
              <Sk className="h-8 w-20" />
              <Sk className="h-8 w-20" />
              <Sk className="h-8 w-24" />
            </div>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="flex md:hidden gap-1.5 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Sk className="flex-1 h-9 rounded-xl" />
          <Sk className="flex-1 h-9 rounded-xl" />
          <Sk className="flex-1 h-9 rounded-xl" />
        </div>

        {/* Document tree body */}
        <div className="flex-1 overflow-hidden px-3 md:px-6 pt-5 pb-6 space-y-6">
          {[
            { titleW: 'w-36', tasks: [160, 220, 140] },
            { titleW: 'w-48', tasks: [200, 130] },
            { titleW: 'w-28', tasks: [180, 250, 100] },
          ].map((s, i) => (
            <div key={i} className="space-y-2.5">
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <Sk className="w-5 h-5 rounded" />
                <Sk className={`h-5 ${s.titleW}`} />
              </div>
              {/* Task rows */}
              {s.tasks.map((w, j) => (
                <div key={j} className="flex items-center gap-3 pl-8">
                  <Sk className="w-4 h-4 rounded flex-shrink-0" />
                  <Sk className="h-4 rounded-lg" style={{ width: w }} />
                </div>
              ))}
            </div>
          ))}
          {/* Add section button area */}
          <div className="pt-2 border-t border-white/5">
            <Sk className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Workspace ────────────────────────────────────────────────────────────

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  const journey      = useProjectStore(useShallow(s => s.journeys.find(j => j.id === id)))
  const nodes        = useProjectStore(useShallow(s => s.nodes[id] || []))
  const loading      = useProjectStore(s => s.loading)
  const { updateJourney } = useProjectStore()

  const totalTasks = nodes.filter(n => n.type === 'task').length
  const doneTasks  = nodes.filter(n => n.type === 'task' && n.checked).length
  const progress   = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0
  const accentHex  = COLOR_HEX[journey?.color] || COLOR_HEX.emerald

  if (loading && !journey) return <WorkspaceSkeleton />

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
        {/* ── Top bar ── */}
        <div className="flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>

          {/* Title row */}
          <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 gap-2">

            {/* Left: color dot + editable title + task stats (mobile) */}
            <div className="flex items-start md:items-center gap-2 md:gap-3 min-w-0">
              {/* Journey color dot — mobile only */}
              <span
                className="md:hidden mt-[3px] w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: accentHex }}
              />
              <div className="min-w-0">
                <EditableTitle
                  value={journey.name}
                  onSave={(val) => updateJourney(id, { name: val })}
                  className="text-white font-semibold text-base md:text-lg hover:text-emerald-400 transition-colors truncate"
                  inputClassName="text-white font-semibold text-base md:text-lg"
                  showIcon
                />
                {/* Task count — mobile only */}
                {totalTasks > 0 && (
                  <p className="md:hidden text-[11px] text-gray-600 mt-0.5 leading-none">
                    {doneTasks} of {totalTasks} tasks done
                  </p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Progress badge */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                style={{
                  background: `${accentHex}1a`,
                  border: `1px solid ${accentHex}33`,
                  color: accentHex,
                }}
              >
                {progress}%
                <span className="hidden md:inline"> done</span>
              </span>

              {/* Desktop nav buttons */}
              <div className="hidden md:flex items-center gap-1.5">
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
          </div>

          {/* Mobile progress bar */}
          <div className="md:hidden mx-3 mb-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: accentHex, opacity: 0.75 }}
            />
          </div>

          {/* Mobile tab bar */}
          <div className="flex md:hidden items-center gap-1.5 px-3 py-2.5">
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={
                chatOpen
                  ? { background: `${accentHex}1a`, color: accentHex, border: `1px solid ${accentHex}33` }
                  : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid transparent" }
              }
            >
              <Bot size={13} />
              AI Co-Pilot
              {chatOpen && (
                <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: accentHex }} />
              )}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 md:px-6 pt-3 md:pt-5 pb-24 md:pb-6 min-w-0">
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
              style={{ background: "var(--bg-base)", animation: "slideUpFade 0.22s cubic-bezier(0.32,0.72,0,1)" }}
            >
              <style>{`@keyframes slideUpFade{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

              {/* Overlay header */}
              <div
                className="flex items-center gap-3 px-4 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--border)", paddingTop: "env(safe-area-inset-top, 12px)", paddingBottom: 14 }}
              >
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-xl transition-colors flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
                >
                  <X size={16} />
                </button>
                {/* Journey color + name context */}
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentHex }} />
                <span className="text-gray-500 text-xs truncate flex-1">{journey.name}</span>
                {/* AI label */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Bot size={14} className="text-emerald-400" />
                  <span className="text-white text-sm font-semibold">AI Co-Pilot</span>
                </div>
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
