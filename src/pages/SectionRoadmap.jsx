import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Check, ChevronRight, LayoutList, LayoutGrid, FileText, GitBranch, Paperclip } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import TaskDrawer from '../components/Workspace/TaskDrawer'
import EditableTitle from '../components/UI/EditableTitle'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'

// ── Timeline card (list view) ─────────────────────────────────────────────────

function TimelineCard({ node, journeyId, index, total, onOpen }) {
  const { updateNode, addActivity } = useProjectStore()
  const user = useAuthStore(s => s.user)
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

  return (
    <div className="flex gap-5 group/card">
      {/* Timeline spine */}
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
      <div className="flex-1 mb-5 cursor-pointer group/inner" onClick={() => onOpen(node)}>
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
              {node.description && (
                <p className="text-gray-600 text-xs mt-1.5 line-clamp-1">{node.description}</p>
              )}
              <TaskBadges node={node} />
            </div>
            <ChevronRight size={14} className="text-gray-700 group-hover/inner:text-emerald-400 group-hover/inner:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Grid card ────────────────────────────────────────────────────────────────

function GridCard({ node, journeyId, index, onOpen }) {
  const { updateNode, addActivity } = useProjectStore()
  const user = useAuthStore(s => s.user)
  const updateStreak = useAuthStore(s => s.updateStreak)

  const toggleCheck = (e) => {
    e.stopPropagation()
    const checked = !node.checked
    updateNode(journeyId, node.id, { checked })
    if (checked) {
      addActivity(journeyId, user?.username, `completed "${node.content}"`)
      updateStreak()
    }
  }

  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-all group flex flex-col gap-3"
      style={{
        background: node.checked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${node.checked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'}`,
        opacity: node.checked ? 0.6 : 1,
      }}
      onClick={() => onOpen(node)}
      onMouseEnter={e => { if (!node.checked) e.currentTarget.style.borderColor = 'rgba(16,185,129,0.28)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = node.checked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)' }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <button
          onClick={toggleCheck}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all hover:scale-110 mt-0.5"
          style={{
            background: node.checked ? '#10b981' : 'transparent',
            borderColor: node.checked ? '#10b981' : 'rgba(255,255,255,0.2)',
            boxShadow: node.checked ? '0 0 12px rgba(16,185,129,0.35)' : 'none',
          }}
        >
          {node.checked
            ? <Check size={13} className="text-white" />
            : <span className="text-gray-600 text-xs font-semibold">{index + 1}</span>}
        </button>
        <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${node.checked ? 'line-through text-gray-500' : 'text-white'}`}>
          {node.content}
        </p>
        <ChevronRight size={13} className="text-gray-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 pl-11">{node.description}</p>
      )}

      {/* Badges */}
      <div className="pl-11">
        <TaskBadges node={node} />
      </div>

      {/* Extra indicators row */}
      {(node.diagram || node.attachments?.length > 0 || node.description) && (
        <div className="flex items-center gap-2 pt-1 pl-11" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {node.description && <FileText size={11} className="text-gray-700" />}
          {node.diagram && <GitBranch size={11} className="text-violet-500/60" />}
          {node.attachments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-gray-700">
              <Paperclip size={11} />
              <span className="text-[10px]">{node.attachments.length}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared badge strip ────────────────────────────────────────────────────────

function TaskBadges({ node }) {
  if (!node.assignedTo && !node.dueDate && !node.attachments?.length && !node.diagram) return null
  return (
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
    </div>
  )
}

// ── View toggle button ────────────────────────────────────────────────────────

function ViewToggle({ view, setView }) {
  return (
    <div className="flex items-center rounded-xl p-1 gap-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {[
        { id: 'list', Icon: LayoutList,  label: 'List view' },
        { id: 'grid', Icon: LayoutGrid,  label: 'Grid view' },
      ].map(({ id, Icon, label }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          title={label}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={view === id
            ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
            : { color: '#6b7280' }}
          onMouseEnter={e => { if (view !== id) e.currentTarget.style.color = '#9ca3af' }}
          onMouseLeave={e => { if (view !== id) e.currentTarget.style.color = '#6b7280' }}
        >
          <Icon size={15} strokeWidth={view === id ? 2.2 : 1.8} />
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SectionRoadmap() {
  const { id: journeyId, sectionId } = useParams()
  const navigate = useNavigate()
  const [activeTask, setActiveTask] = useState(null)
  const [view, setView] = useState('list')

  const journey  = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)))
  const section  = useProjectStore(useShallow(s => (s.nodes[journeyId] || []).find(n => n.id === sectionId)))
  const tasks    = useProjectStore(useShallow(s =>
    (s.nodes[journeyId] || [])
      .filter(n => n.parentId === sectionId && n.type === 'task')
      .sort((a, b) => a.order - b.order)
  ))
  const liveActiveTask = useProjectStore(useShallow(s =>
    activeTask ? (s.nodes[journeyId] || []).find(n => n.id === activeTask.id) : null
  ))

  const { updateNode, addNode } = useProjectStore()

  const done     = tasks.filter(t => t.checked).length
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0

  if (!journey || !section) {
    return (
      <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
        <Sidebar />
        <main className="md:ml-52 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-3">Section not found.</p>
            <button onClick={() => navigate(`/journey/${journeyId}`)} className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to workspace</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />

      <main className="md:ml-52 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => navigate(`/journey/${journeyId}`)}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/5"
          >
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

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Progress */}
            <div className="text-right hidden sm:block">
              <p className="text-gray-500 text-xs">{done} / {tasks.length} done</p>
              <p className="text-sm font-semibold" style={{ color: '#10b981' }}>{progress}%</p>
            </div>
            <div className="w-24 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#10b981' }} />
            </div>

            {/* View toggle */}
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
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
          ) : view === 'list' ? (
            /* ── List / timeline view ── */
            <div style={{ maxWidth: 680 }}>
              {tasks.map((task, i) => (
                <TimelineCard
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
          ) : (
            /* ── Grid view ── */
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task, i) => (
                  <GridCard
                    key={task.id}
                    node={task}
                    journeyId={journeyId}
                    index={i}
                    onOpen={t => setActiveTask(t)}
                  />
                ))}

                {/* Add task card */}
                <button
                  onClick={() => addNode(journeyId, sectionId, 'task', 'New task')}
                  className="rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-emerald-400 transition-all group"
                  style={{ border: '2px dashed rgba(255,255,255,0.07)', minHeight: 80 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; e.currentTarget.style.background = 'rgba(16,185,129,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Plus size={15} className="transition-colors" />
                  Add Task
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {liveActiveTask && (
        <TaskDrawer
          node={liveActiveTask}
          journeyId={journeyId}
          journeyName={journey?.name || ''}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  )
}
