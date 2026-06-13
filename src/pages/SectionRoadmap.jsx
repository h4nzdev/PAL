import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Check, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import TaskDrawer from '../components/Workspace/TaskDrawer'
import EditableTitle from '../components/UI/EditableTitle'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'

function TaskCard({ node, journeyId, index, total, onOpen }) {
  const { updateNode } = useProjectStore()
  const user = useAuthStore(s => s.user)
  const { addActivity } = useProjectStore()
  const updateStreak = useAuthStore(s => s.updateStreak)
  const isLast = index === total - 1

  const toggleCheck = (e) => {
    e.stopPropagation()
    const checked = !node.checked
    updateNode(journeyId, node.id, { checked })
    if (checked) {
      addActivity(journeyId, user?.username, `completed "${node.content}"`)
      updateStreak()
    }
  }

  const hasExtras = node.description || node.diagram || (node.attachments?.length > 0)

  return (
    <div className="flex gap-5 group/card">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
        <button
          onClick={toggleCheck}
          className="w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all flex-shrink-0 hover:scale-105"
          style={{
            background: node.checked ? '#10b981' : '#0c1220',
            borderColor: node.checked ? '#10b981' : 'rgba(255,255,255,0.15)',
            boxShadow: node.checked ? '0 0 16px rgba(16,185,129,0.3)' : 'none',
          }}
        >
          {node.checked
            ? <Check size={16} className="text-white" />
            : <span className="text-gray-500 text-sm font-medium">{index + 1}</span>}
        </button>
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }} />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 mb-5 cursor-pointer group/inner"
        onClick={() => onOpen(node)}
      >
        <div
          className="rounded-xl p-4 transition-all"
          style={{
            background: node.checked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${node.checked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'}`,
            opacity: node.checked ? 0.65 : 1,
          }}
          onMouseEnter={e => { if (!node.checked) e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = node.checked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)' }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${node.checked ? 'line-through text-gray-500' : 'text-white'}`}>
                {node.content}
              </p>

              {/* Preview of notes */}
              {node.description && (
                <p className="text-gray-600 text-xs mt-1.5 line-clamp-1">{node.description}</p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {node.assignedTo && (
                  <span className="text-xs text-emerald-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    @{node.assignedTo}
                  </span>
                )}
                {node.dueDate && (
                  <span className="text-xs text-amber-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {node.dueDate}
                  </span>
                )}
                {node.attachments?.length > 0 && (
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    📎 {node.attachments.length}
                  </span>
                )}
                {node.diagram && (
                  <span className="text-xs text-violet-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    diagram
                  </span>
                )}
              </div>
            </div>

            <ChevronRight size={14} className="text-gray-700 group-hover/inner:text-emerald-400 group-hover/inner:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SectionRoadmap() {
  const { id: journeyId, sectionId } = useParams()
  const navigate = useNavigate()
  const [activeTask, setActiveTask] = useState(null)

  const journey  = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)))
  const section  = useProjectStore(useShallow(s => (s.nodes[journeyId] || []).find(n => n.id === sectionId)))
  const tasks    = useProjectStore(useShallow(s =>
    (s.nodes[journeyId] || [])
      .filter(n => n.parentId === sectionId && n.type === 'task')
      .sort((a, b) => a.order - b.order)
  ))
  // Always read active task live from store so drawer reflects store updates
  const liveActiveTask = useProjectStore(useShallow(s =>
    activeTask ? (s.nodes[journeyId] || []).find(n => n.id === activeTask.id) : null
  ))

  const { updateNode, addNode } = useProjectStore()

  const done     = tasks.filter(t => t.checked).length
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0

  if (!journey || !section) {
    return (
      <div className="flex min-h-screen text-white" style={{ background: '#030712' }}>
        <Sidebar />
        <main className="ml-52 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-3">Section not found.</p>
            <button onClick={() => navigate(`/journey/${journeyId}`)} className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to workspace</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: '#030712' }}>
      <Sidebar />

      <main className="ml-52 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => navigate(`/journey/${journeyId}`)} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/5">
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-gray-600 text-xs mb-0.5">{journey.name}</p>
            <EditableTitle
              value={section.content}
              onSave={val => updateNode(journeyId, sectionId, { content: val })}
              className="text-white font-bold text-2xl hover:text-emerald-400 transition-colors"
              inputClassName="text-white font-bold text-2xl w-full"
              showIcon
            />
            {section.description && (
              <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">{section.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-gray-500 text-xs">{done} / {tasks.length} done</p>
              <p className="text-sm font-semibold" style={{ color: '#10b981' }}>{progress}%</p>
            </div>
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="flex-1 overflow-y-auto px-8 py-8" style={{ maxWidth: 680 }}>
          {tasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mx-auto mb-4">
                <Plus size={22} className="text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm mb-5">No tasks yet. Add your first milestone.</p>
              <button
                onClick={() => addNode(journeyId, sectionId, 'task', 'New task')}
                className="text-emerald-400 border border-emerald-500/25 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-emerald-500/10"
                style={{ background: 'rgba(16,185,129,0.08)' }}
              >
                Add First Task
              </button>
            </div>
          ) : (
            <div>
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  node={task}
                  journeyId={journeyId}
                  index={i}
                  total={tasks.length}
                  onOpen={t => setActiveTask(t)}
                />
              ))}

              <button
                onClick={() => addNode(journeyId, sectionId, 'task', 'New task')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-400 transition-colors mt-2"
                style={{ marginLeft: 60 }}
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
          )}
        </div>
      </main>

      {liveActiveTask && (
        <TaskDrawer
          node={liveActiveTask}
          journeyId={journeyId}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  )
}
