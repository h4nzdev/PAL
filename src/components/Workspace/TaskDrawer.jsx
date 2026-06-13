import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, CheckCircle2, Circle, Calendar, User,
  FileText, GitBranch, ImageIcon, Trash2, Upload, ExternalLink,
  Users, MessageCircle, Send, Video,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import mermaid from 'mermaid'
import useProjectStore from '../../store/useProjectStore'
import useAuthStore from '../../store/useAuthStore'
import useToastStore from '../../store/useToastStore'
import CallModal from './CallModal'

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })

// ─── Diagram block ────────────────────────────────────────────────────────────

function DiagramBlock({ code, onChange, onBlur }) {
  const [mode, setMode] = useState('code')
  const [error, setError] = useState('')
  const previewRef = useRef(null)
  const renderCount = useRef(0)

  const renderDiagram = useCallback(async () => {
    if (!previewRef.current) return
    if (!code.trim()) {
      previewRef.current.innerHTML = '<p style="color:#4b5563;font-size:12px">Nothing to preview yet.</p>'
      setError('')
      return
    }
    try {
      const id = `mer-${++renderCount.current}`
      const { svg } = await mermaid.render(id, code)
      previewRef.current.innerHTML = svg
      previewRef.current.querySelector('svg')?.setAttribute('style', 'max-width:100%;border-radius:8px;')
      setError('')
    } catch {
      setError('Syntax error — check your diagram code.')
    }
  }, [code])

  const handlePreview = () => {
    setMode('preview')
    renderDiagram()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs">Mermaid syntax</span>
        <div className="flex rounded-lg overflow-hidden border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <button
            onClick={() => setMode('code')}
            className={`px-3 py-1 text-xs transition-all ${mode === 'code' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Code
          </button>
          <button
            onClick={handlePreview}
            className={`px-3 py-1 text-xs transition-all ${mode === 'preview' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === 'code' ? (
        <textarea
          value={code}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={`graph TD\n  A[Start] --> B[Build feature]\n  B --> C{Tests pass?}\n  C -->|Yes| D[Ship it! 🚀]\n  C -->|No| B`}
          rows={10}
          className="w-full rounded-xl px-4 py-3 text-emerald-300 text-xs font-mono focus:outline-none resize-none leading-relaxed placeholder:text-gray-700"
          style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.3)' }}
        />
      ) : (
        <div>
          {error ? (
            <div className="rounded-xl px-4 py-3 text-red-400 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          ) : (
            <div
              ref={previewRef}
              className="rounded-xl p-4 min-h-32 flex items-center justify-center overflow-auto"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          )}
        </div>
      )}

      <p className="text-gray-700 text-xs">
        Uses{' '}
        <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-500">
          Mermaid syntax ↗
        </a>
        {' '}· flowchart, sequence, gantt, and more.
      </p>
    </div>
  )
}

// ─── Attachment block ─────────────────────────────────────────────────────────

function AttachmentBlock({ attachments = [], onAdd, onRemove }) {
  const fileRef = useRef(null)

  return (
    <div className="space-y-4">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-all group"
        style={{ border: '2px dashed rgba(255,255,255,0.1)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.background = 'rgba(16,185,129,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'transparent' }}
      >
        <Upload size={22} className="text-gray-600 group-hover:text-emerald-400 transition-colors" />
        <span className="text-gray-400 text-sm">Click to upload images</span>
        <span className="text-gray-600 text-xs">PNG, JPG, GIF, WebP</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onAdd} className="hidden" />

      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {attachments.map(att => (
            <div key={att.id} className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30" style={{ aspectRatio: '16/9' }}>
              <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.65)' }}>
                <a href={att.dataUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all">
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => onRemove(att.id)} className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <p className="text-white text-[10px] truncate">{att.name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-700 text-sm py-4">No attachments yet.</p>
      )}
    </div>
  )
}

// ─── People tab ───────────────────────────────────────────────────────────────

function PeopleTab({ node, journeyId, assignee, setAssignee, onCall }) {
  const users      = useAuthStore(useShallow(s => s.users))
  const currentUser = useAuthStore(s => s.user)
  const { updateNode } = useProjectStore()

  const assign = (username) => {
    const next = assignee === username ? null : username
    setAssignee(next || '')
    updateNode(journeyId, node.id, { assignedTo: next })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Team Members</p>
          <p className="text-gray-600 text-xs mt-0.5">Click a member to assign this task</p>
        </div>
        <button
          onClick={onCall}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <Video size={12} /> Start Call
        </button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl py-10 flex flex-col items-center gap-2 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Users size={28} className="text-gray-700" />
          <p className="text-gray-500 text-sm">No team members yet</p>
          <p className="text-gray-700 text-xs">Invite collaborators via Settings → Team</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const isAssigned = assignee === u.username
            const isMe = u.id === currentUser?.id
            return (
              <button
                key={u.id}
                onClick={() => assign(u.username)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                style={{
                  background: isAssigned ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isAssigned ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                }}
                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                  style={{
                    background: isAssigned ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.08)',
                    color: isAssigned ? '#34d399' : '#9ca3af',
                  }}
                >
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isAssigned ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {u.username}{isMe && <span className="text-gray-600 text-xs ml-1.5">(you)</span>}
                  </p>
                  <p className="text-gray-600 text-xs truncate">{u.email}</p>
                </div>
                {isAssigned && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#10b981' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {assignee && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <span className="text-emerald-400 text-xs">Assigned to</span>
          <span className="text-emerald-300 font-medium text-xs">@{assignee}</span>
          <button
            onClick={() => assign(assignee)}
            className="ml-auto text-gray-600 hover:text-red-400 transition-colors text-xs"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Chat tab ─────────────────────────────────────────────────────────────────

function ChatMessages({ taskId }) {
  const currentUser = useAuthStore(s => s.user)
  const messages    = useProjectStore(useShallow(s => s.taskMessages[taskId] || []))
  const { addTaskMessage, fetchTaskMessages } = useProjectStore()
  const [text, setText]   = useState('')
  const bottomRef = useRef(null)

  // Load messages from Supabase when chat tab opens
  useEffect(() => { fetchTaskMessages(taskId) }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = () => {
    const trimmed = text.trim()
    if (!trimmed || !currentUser) return
    addTaskMessage(taskId, currentUser.id, currentUser.username, trimmed)
    setText('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto py-5 px-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageCircle size={30} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-700 text-xs mt-1">Start the conversation about this task</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === currentUser?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-gray-600 text-[10px] px-1">{msg.username}</span>
                  )}
                  <div
                    className="px-3.5 py-2 text-sm leading-relaxed"
                    style={{
                      background: isMe ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isMe ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.08)'}`,
                      color: isMe ? '#d1fae5' : '#d1d5db',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}
                  >
                    {msg.text}
                  </div>
                  <span className="text-gray-700 text-[10px] px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Message… (Enter to send)"
            rows={2}
            className="flex-1 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none resize-none placeholder:text-gray-700 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.3)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: '#10b981' }}
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-gray-700 text-[10px] mt-1.5">Shift+Enter for new line</p>
      </div>
    </>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'notes',       label: 'Notes',   icon: FileText     },
  { key: 'diagram',     label: 'Diagram', icon: GitBranch    },
  { key: 'files',       label: 'Files',   icon: ImageIcon    },
  { key: 'people',      label: 'People',  icon: Users        },
  { key: 'chat',        label: 'Chat',    icon: MessageCircle },
]

// ─── Main drawer ──────────────────────────────────────────────────────────────

export default function TaskDrawer({ node, journeyId, onClose }) {
  const { updateNode, deleteNode } = useProjectStore()
  const toast = useToastStore(s => s.toast)

  const [tab,          setTab]          = useState('notes')
  const [callOpen,     setCallOpen]     = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title,        setTitle]        = useState(node.content)
  const [assignee,     setAssignee]     = useState(node.assignedTo || '')
  const [dueDate,      setDueDate]      = useState(node.dueDate || '')
  const [notes,        setNotes]        = useState(node.description || '')
  const [diagram,      setDiagram]      = useState(node.diagram || '')

  useEffect(() => { if (!editingTitle) setTitle(node.content) }, [node.content, editingTitle])

  // Sync external assignedTo changes (e.g. from People tab direct updateNode)
  useEffect(() => { setAssignee(node.assignedTo || '') }, [node.assignedTo])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !callOpen) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, callOpen])

  const saveTitle = () => {
    if (title.trim()) updateNode(journeyId, node.id, { content: title.trim() })
    setEditingTitle(false)
  }

  const saveMeta    = () => updateNode(journeyId, node.id, { assignedTo: assignee.trim() || null, dueDate: dueDate || null })
  const saveNotes   = () => updateNode(journeyId, node.id, { description: notes })
  const saveDiagram = () => updateNode(journeyId, node.id, { diagram })

  const toggleCheck = () => updateNode(journeyId, node.id, { checked: !node.checked })

  const handleImageAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        const next = [...(node.attachments || []), { id: crypto.randomUUID(), name: file.name, dataUrl: evt.target.result }]
        updateNode(journeyId, node.id, { attachments: next })
        toast('Image attached.')
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
    toast('Task deleted.', 'error')
  }

  const attachCount = node.attachments?.length || 0
  const msgCount    = useProjectStore.getState().taskMessages[node.id]?.length || 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col shadow-2xl"
        style={{ width: 520, background: '#0c1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-3">
            <button onClick={toggleCheck} className="flex-shrink-0 mt-1 transition-all hover:scale-110">
              {node.checked
                ? <CheckCircle2 size={20} className="text-emerald-400" />
                : <Circle size={20} className="text-gray-600 hover:text-emerald-400 transition-colors" />}
            </button>

            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                  className="w-full bg-transparent text-white font-semibold text-lg focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className={`font-semibold text-lg cursor-text hover:text-emerald-400 transition-colors leading-snug ${node.checked ? 'line-through text-gray-500' : 'text-white'}`}
                  title="Click to rename"
                >
                  {node.content}
                </h2>
              )}
              <p className="text-gray-700 text-[11px] mt-0.5">Click title to rename · Esc to close</p>
            </div>

            <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-1">
              <X size={17} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex gap-2 mt-3 ml-8">
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 flex-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <User size={11} className="text-gray-500 flex-shrink-0" />
              <input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                onBlur={saveMeta}
                placeholder="Assignee"
                className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-700 w-full"
              />
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 flex-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Calendar size={11} className="text-gray-500 flex-shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); updateNode(journeyId, node.id, { dueDate: e.target.value || null }) }}
                className="bg-transparent text-white text-xs focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex px-4 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 -mb-px transition-all whitespace-nowrap flex-shrink-0 ${
                tab === key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-600 hover:text-gray-300'
              }`}
            >
              <Icon size={11} />
              {label}
              {key === 'files' && attachCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                  {attachCount}
                </span>
              )}
              {key === 'chat' && msgCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  {msgCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'notes' && (
            <div className="flex-1 overflow-y-auto p-5">
              <label className="text-gray-500 text-xs block mb-2">Notes & Description</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes, acceptance criteria, links, context…"
                rows={14}
                className="w-full rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none resize-none leading-relaxed placeholder:text-gray-700"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; saveNotes() }}
              />
              <p className="text-gray-700 text-xs mt-2">Saved automatically on blur.</p>
            </div>
          )}

          {tab === 'diagram' && (
            <div className="flex-1 overflow-y-auto p-5">
              <DiagramBlock code={diagram} onChange={setDiagram} onBlur={saveDiagram} />
            </div>
          )}

          {tab === 'files' && (
            <div className="flex-1 overflow-y-auto p-5">
              <AttachmentBlock attachments={node.attachments || []} onAdd={handleImageAdd} onRemove={handleImageRemove} />
            </div>
          )}

          {tab === 'people' && (
            <div className="flex-1 overflow-y-auto p-5">
              <PeopleTab
                node={node}
                journeyId={journeyId}
                assignee={assignee}
                setAssignee={setAssignee}
                onCall={() => setCallOpen(true)}
              />
            </div>
          )}

          {tab === 'chat' && (
            <ChatMessages taskId={node.id} />
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-gray-700 text-[11px] font-mono">#{node.id.slice(0, 8)}</span>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/8"
          >
            <Trash2 size={12} /> Delete task
          </button>
        </div>
      </div>

      {callOpen && (
        <CallModal
          onClose={() => setCallOpen(false)}
          taskTitle={node.content}
          taskId={node.id}
        />
      )}
    </>
  )
}
