import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import DocumentTree from '../components/Workspace/DocumentTree'
import AIChat from '../components/Workspace/AIChat'
import EditableTitle from '../components/UI/EditableTitle'
import useProjectStore from '../store/useProjectStore'

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
    return (
      <div className="flex min-h-screen text-white" style={{ background: '#030712' }}>
        <Sidebar />
        <main className="ml-52 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-3">Journey not found.</p>
            <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to Dashboard</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ background: '#030712' }}>
      <Sidebar />
      <div className="ml-52 flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <EditableTitle
              value={journey.name}
              onSave={val => updateJourney(id, { name: val })}
              className="text-white font-semibold text-lg hover:text-emerald-400 transition-colors"
              inputClassName="text-white font-semibold text-lg"
              showIcon
            />
            <span className="text-xs text-emerald-400 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
              {progress}% done
            </span>
          </div>
          <button
            onClick={() => setChatOpen(o => !o)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
            style={chatOpen
              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid transparent' }}
          >
            <Bot size={15} /> AI Co-Pilot
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            <DocumentTree journeyId={id} />
          </div>

          {chatOpen && (
            <div className="w-80 flex-shrink-0 overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,13,24,0.8)' }}>
              <AIChat journeyName={journey.name} nodes={nodes} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
