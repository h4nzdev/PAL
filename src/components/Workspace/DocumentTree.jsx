import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, X, FileText } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useProjectStore from '../../store/useProjectStore'
import useAuthStore from '../../store/useAuthStore'
import TaskDrawer from './TaskDrawer'
import { COLOR_HEX } from '../../lib/colors'
import { useJourneyRole, canEdit, canUpload } from '../../lib/useJourneyRole'

// ─── New Section Modal ────────────────────────────────────────────────────────

function NewSectionModal({ journeyId, onClose }) {
  const navigate = useNavigate()
  const { addNode, updateNode } = useProjectStore()
  const [name, setName]        = useState('')
  const [desc, setDesc]        = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const section = addNode(journeyId, null, 'header', trimmed)
    if (desc.trim()) updateNode(journeyId, section.id, { description: desc.trim() })
    navigate(`/journey/${journeyId}/section/${section.id}`)
    onClose()
  }

  const onNameKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate() }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.09)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <FileText size={13} className="text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-sm">New Section</h2>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Section name */}
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">
                Section name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={onNameKey}
                placeholder="e.g. Phase 1 — Research, Design Sprint, Launch Prep…"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-700 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">
                Description <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What's this section about? Goals, deliverables, context…"
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-gray-200 text-sm placeholder:text-gray-700 focus:outline-none resize-none leading-relaxed transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: '#10b981', color: 'white', boxShadow: name.trim() ? '0 0 16px rgba(16,185,129,0.25)' : 'none' }}
            >
              <Plus size={14} /> Create Section
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, journeyId, role }) {
  const navigate = useNavigate()
  const { deleteNode } = useProjectStore()
  const tasks   = useProjectStore(
    useShallow(s => (s.nodes[journeyId] || []).filter(n => n.parentId === section.id && n.type === 'task'))
  )
  const done     = tasks.filter(t => t.checked).length
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const journey  = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)))
  const hex      = COLOR_HEX[journey?.color] || COLOR_HEX.emerald

  return (
    <div className="group relative">
      <button
        onClick={() => navigate(`/journey/${journeyId}/section/${section.id}`)}
        className="w-full text-left rounded-xl p-4 transition-all overflow-hidden active:scale-[0.99] active:brightness-110 touch-manipulation"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = `${hex}40` }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${hex}, transparent)` }} />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">
              {section.content}
            </h3>
            {section.description && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-1 leading-relaxed">
                {section.description}
              </p>
            )}
            <p className="text-gray-700 text-xs mt-1">
              {tasks.length === 0 ? 'No tasks yet' : `${done} / ${tasks.length} tasks · ${progress}%`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {tasks.length > 0 && (
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: hex }} />
              </div>
            )}
            <ChevronRight size={14} className="text-gray-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>

      {canEdit(role) && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(journeyId, section.id) }}
          className="absolute top-3 right-8 opacity-30 md:opacity-0 group-hover:opacity-100 active:opacity-100 text-gray-700 hover:text-red-400 active:text-red-400 transition-all p-1.5 rounded-lg touch-manipulation"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Root task item ───────────────────────────────────────────────────────────

function RootTaskItem({ node, journeyId, onOpen, role }) {
  const { updateNode, addActivity } = useProjectStore()
  const user = useAuthStore(s => s.user)
  const updateStreak = useAuthStore(s => s.updateStreak)

  const toggleCheck = (e) => {
    e.stopPropagation()
    const checked = !node.checked
    updateNode(journeyId, node.id, { checked })
    if (checked) {
      addActivity(journeyId, user?.username, `checked off "${node.content}"`)
      updateStreak()
    }
  }

  return (
    <div
      className="group flex items-center gap-2.5 py-2.5 px-2 rounded-xl hover:bg-white/5 active:bg-white/8 transition-all cursor-pointer min-h-[44px] touch-manipulation"
      onClick={() => onOpen(node)}
    >
      <button
        onClick={toggleCheck}
        disabled={!canEdit(role)}
        className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: node.checked ? '#10b981' : 'transparent', borderColor: node.checked ? '#10b981' : 'rgba(255,255,255,0.2)' }}
      >
        {node.checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm transition-colors ${node.checked ? 'text-gray-600 line-through' : 'text-gray-300 group-hover:text-white'}`}>
        {node.content}
      </span>

      {node.attachments?.length > 0 && <span className="text-gray-600 text-xs">📎</span>}
      {node.description && <span className="text-gray-700 text-xs">✏️</span>}

      <ChevronRight size={12} className="text-gray-700 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  )
}

// ─── Document tree ────────────────────────────────────────────────────────────

export default function DocumentTree({ journeyId }) {
  const [activeTask,   setActiveTask]   = useState(null)
  const [sectionModal, setSectionModal] = useState(false)

  const role        = useJourneyRole(journeyId)
  const nodes       = useProjectStore(useShallow(s => s.nodes[journeyId] || []))
  const journeyName = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)?.name || ''))
  const { addNode } = useProjectStore()

  const liveActiveTask = useProjectStore(useShallow(s =>
    activeTask ? (s.nodes[journeyId] || []).find(n => n.id === activeTask.id) : null
  ))

  const sections  = nodes.filter(n => n.parentId === null && n.type === 'header').sort((a, b) => a.order - b.order)
  const rootTasks = nodes.filter(n => n.parentId === null && n.type === 'task').sort((a, b) => a.order - b.order)

  return (
    <>
      <div className="space-y-3">
        {sections.length === 0 && rootTasks.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-gray-600 text-sm mb-1">This journey is empty.</p>
            <p className="text-gray-700 text-xs">Add a section to create a roadmap, or a quick task below.</p>
          </div>
        )}

        {sections.map(section => (
          <SectionCard key={section.id} section={section} journeyId={journeyId} role={role} />
        ))}

        {rootTasks.length > 0 && (
          <div className="pt-2">
            {sections.length > 0 && (
              <p className="text-gray-700 text-[10px] px-2 mb-2 uppercase tracking-widest">Quick Tasks</p>
            )}
            {rootTasks.map(task => (
              <RootTaskItem key={task.id} node={task} journeyId={journeyId} onOpen={t => setActiveTask(t)} role={role} />
            ))}
          </div>
        )}

        {(canEdit(role) || canUpload(role)) && (
          <div className="flex gap-2 pt-3 border-t border-white/5">
            {canEdit(role) && (
              <button
                onClick={() => setSectionModal(true)}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emerald-400 active:text-emerald-400 transition-colors px-3 py-2.5 rounded-xl hover:bg-emerald-500/8 active:bg-emerald-500/8 touch-manipulation"
              >
                <Plus size={13} /> Add Section
              </button>
            )}
            {canUpload(role) && (
              <button
                onClick={() => addNode(journeyId, null, 'task', 'New task')}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 active:text-gray-300 transition-colors px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/5 touch-manipulation"
              >
                <Plus size={13} /> Quick Task
              </button>
            )}
          </div>
        )}
      </div>

      {sectionModal && (
        <NewSectionModal journeyId={journeyId} onClose={() => setSectionModal(false)} />
      )}

      {liveActiveTask && (
        <TaskDrawer
          node={liveActiveTask}
          journeyId={journeyId}
          journeyName={journeyName}
          onClose={() => setActiveTask(null)}
        />
      )}
    </>
  )
}
