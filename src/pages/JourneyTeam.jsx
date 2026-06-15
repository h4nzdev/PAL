import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Crown, Pencil, Eye, Upload, Trash2, Hash, UserPlus, Loader2, Plus } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import Sidebar from '../components/Layout/Sidebar'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES = {
  owner:    { label: 'Owner',    icon: Crown,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  editor:   { label: 'Editor',   icon: Pencil, color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  uploader: { label: 'Uploader', icon: Upload, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  viewer:   { label: 'Viewer',   icon: Eye,    color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
}

const ASSIGNABLE_ROLES = ['editor', 'uploader', 'viewer']

function RoleBadge({ role }) {
  const cfg = ROLES[role] || ROLES.viewer
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function RoleSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs px-2.5 py-1.5 rounded-lg focus:outline-none transition-all cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db' }}
    >
      {ASSIGNABLE_ROLES.map(r => (
        <option key={r} value={r} style={{ background: '#0c1220' }}>
          {ROLES[r].label}
        </option>
      ))}
    </select>
  )
}

function MemberRow({ member, isOwnerView, currentUserId, journeyId, onRoleChange, onRemove }) {
  const isCurrentUser = member.userId === currentUserId
  const isOwner = member.role === 'owner'
  const initials = member.username?.slice(0, 2).toUpperCase() || '?'
  const cfg = ROLES[member.role] || ROLES.viewer

  return (
    <div
      className="flex items-center gap-2 md:gap-4 px-4 md:px-5 py-3 md:py-4 transition-all group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Avatar */}
      <div
        className="w-8 md:w-9 h-8 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs md:text-sm"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm md:text-base font-medium truncate">
          {member.username}
          {isCurrentUser && <span className="text-gray-600 text-xs ml-1 md:ml-2">(you)</span>}
        </p>
        <p className="text-gray-700 text-xs hidden sm:block">
          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Role */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {isOwnerView && !isOwner ? (
          <RoleSelect
            value={member.role}
            onChange={role => onRoleChange(member.userId, role)}
          />
        ) : (
          <RoleBadge role={member.role} />
        )}

        {/* Remove button — owner can remove non-owners; member can leave */}
        {(isOwnerView && !isOwner) && (
          <button
            onClick={() => onRemove(member.userId, member.username)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Remove member"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Role description cards ────────────────────────────────────────────────────

function RoleCard({ role }) {
  const cfg = ROLES[role]
  const Icon = cfg.icon
  const descriptions = {
    editor:   'Can add, edit, check off, and delete tasks and sections.',
    uploader: 'Can add new tasks but cannot edit or delete existing ones.',
    viewer:   'Read-only access. Can view all content but make no changes.',
  }
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>
      <div>
        <p className="text-white text-xs font-medium mb-0.5">{cfg.label}</p>
        <p className="text-gray-600 text-xs leading-relaxed">{descriptions[role]}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JourneyTeam() {
  const { id: journeyId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const journey = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)))
  const members = useProjectStore(useShallow(s => s.teamMembers[journeyId] || []))
  const { fetchTeamMembers, updateMemberRole, removeMember, addMember } = useProjectStore()
  const [addUsername, setAddUsername] = useState('')
  const [adding, setAdding] = useState(false)

  const isOwner = journey?.ownerId === user?.id

  useEffect(() => {
    fetchTeamMembers(journeyId).finally(() => setLoading(false))
  }, [journeyId])

  const handleRoleChange = async (userId, role) => {
    await updateMemberRole(journeyId, userId, role)
    toast.success(`Role updated to ${ROLES[role].label}`)
  }

  const handleRemove = async (userId, username) => {
    await removeMember(journeyId, userId)
    toast(`@${username} removed from the journey`)
  }

  const handleAddMember = async () => {
    if (!addUsername.trim()) return
    setAdding(true)
    try {
      await addMember(journeyId, addUsername)
      toast.success(`@${addUsername.trim()} added as Viewer`)
      setAddUsername('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(journeyId)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2200)
  }

  if (!journey) {
    return (
      <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
        <Sidebar />
        <main className="md:ml-52 flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Journey not found.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />

      <main className="md:ml-52 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-2 md:gap-4 px-4 md:px-8 py-4 md:py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate(`/journey/${journeyId}`)}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 flex-shrink-0"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-gray-600 text-xs mb-0.5 truncate">{journey.name}</p>
            <h1 className="text-white font-bold text-lg md:text-xl">Team</h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs flex-shrink-0" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
            <UserPlus size={11} />
            <span className="hidden sm:inline">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            <span className="sm:hidden">{members.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24">

            {/* ── Members list ── */}
            <div>
              <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Members</h2>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-gray-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Syncing members…</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-sm">No members yet.</p>
                    <p className="text-gray-700 text-xs mt-1">Share the invite code below or add a teammate by username.</p>
                  </div>
                ) : (
                  members.map(m => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      isOwnerView={isOwner}
                      currentUserId={user?.id}
                      journeyId={journeyId}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                    />
                  ))
                )}

                {/* Add member form — owner only */}
                {isOwner && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 px-3 md:px-4 py-3 md:py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <input
                      value={addUsername}
                      onChange={e => setAddUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                      placeholder="Add by username…"
                      disabled={adding}
                      className="flex-1 px-3 py-2 md:py-2.5 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.35)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={!addUsername.trim() || adding}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 flex-shrink-0 whitespace-nowrap"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Invite code ── */}
            {isOwner && (
              <div>
                <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Invite Code</h2>
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <Hash size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium mb-0.5">Share this code with your team</p>
                      <p className="text-gray-600 text-xs">Teammates paste this code on the dashboard to join. New members start as Viewer — you can update their role here.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-300 select-all truncate"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {journeyId}
                    </div>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0"
                      style={copied
                        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Role guide ── */}
            <div>
              <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Role Permissions</h2>
              <div className="space-y-2">
                {ASSIGNABLE_ROLES.map(r => <RoleCard key={r} role={r} />)}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
