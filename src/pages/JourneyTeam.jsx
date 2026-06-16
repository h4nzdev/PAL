import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Crown, Pencil, Eye, Upload, Trash2, Hash, UserPlus, Loader2, Plus, ChevronDown } from 'lucide-react'
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
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function RoleSelect({ value, onChange }) {
  return (
    <div className="relative flex-shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-xs pl-2.5 pr-6 py-1.5 rounded-lg focus:outline-none transition-all cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db' }}
      >
        {ASSIGNABLE_ROLES.map(r => (
          <option key={r} value={r} style={{ background: '#0c1220' }}>
            {ROLES[r].label}
          </option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  )
}

function MemberRow({ member, isOwnerView, currentUserId, journeyId, onRoleChange, onRemove }) {
  const isCurrentUser = member.userId === currentUserId
  const isOwner = member.role === 'owner'
  const initials = member.username?.slice(0, 2).toUpperCase() || '?'
  const cfg = ROLES[member.role] || ROLES.viewer

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-all group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      >
        {initials}
      </div>

      {/* Name + joined date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-white text-sm font-medium truncate">{member.username}</p>
          {isCurrentUser && <span className="text-gray-600 text-xs">(you)</span>}
        </div>
        <p className="text-gray-700 text-xs mt-0.5">
          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Role + actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isOwnerView && !isOwner ? (
          <>
            <RoleSelect value={member.role} onChange={role => onRoleChange(member.userId, role)} />
            <button
              onClick={() => onRemove(member.userId, member.username)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Remove member"
            >
              <Trash2 size={13} />
            </button>
          </>
        ) : (
          <RoleBadge role={member.role} />
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
    <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>
      <div>
        <p className="text-white text-xs font-semibold mb-0.5">{cfg.label}</p>
        <p className="text-gray-500 text-xs leading-relaxed">{descriptions[role]}</p>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-28">
      <div>
        <div className="h-3 w-16 rounded-lg bg-white/6 animate-pulse mb-3" />
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-9 h-9 rounded-full bg-white/8 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-lg bg-white/8 animate-pulse" />
                <div className="h-3 w-20 rounded-lg bg-white/5 animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/6 animate-pulse" />
            </div>
          ))}
        </div>
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

      <main className="md:ml-52 flex-1 flex flex-col min-h-0">

        {/* ── Top bar ── */}
        <div
          className="flex items-center gap-3 px-4 md:px-8 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 16 }}
        >
          <button
            onClick={() => navigate(`/journey/${journeyId}`)}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all flex-shrink-0 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-gray-600 text-xs truncate leading-none mb-0.5">{journey.name}</p>
            <h1 className="text-white font-bold text-lg leading-none">Team</h1>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
          >
            <UserPlus size={11} />
            <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? <TeamSkeleton /> : (
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-5 md:py-8 space-y-5 md:space-y-8 pb-28 md:pb-10">

              {/* ── Members list ── */}
              <div>
                <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Members</h2>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {members.length === 0 ? (
                    <div className="text-center py-10 px-6">
                      <p className="text-gray-500 text-sm font-medium">No members yet</p>
                      <p className="text-gray-700 text-xs mt-1">Share the invite code or add a teammate below.</p>
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

                  {/* Add member — owner only */}
                  {isOwner && (
                    <div
                      className="flex items-center gap-2 px-4 py-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <input
                        value={addUsername}
                        onChange={e => setAddUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                        placeholder="Add teammate by username…"
                        disabled={adding}
                        className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none disabled:opacity-50 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.35)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={!addUsername.trim() || adding}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 flex-shrink-0 active:scale-95"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                      >
                        {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Invite code ── */}
              {isOwner && (
                <div>
                  <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Invite Code</h2>
                  <div className="rounded-2xl p-4 md:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <Hash size={14} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium mb-0.5">Share with your team</p>
                        <p className="text-gray-600 text-xs leading-relaxed">Teammates paste this on the dashboard to join. New members start as Viewer.</p>
                      </div>
                    </div>

                    {/* Code row — stacks on very small screens */}
                    <div className="flex flex-col xs:flex-row gap-2">
                      <div
                        className="flex-1 rounded-xl px-3.5 py-2.5 font-mono text-xs md:text-sm text-gray-400 select-all overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', wordBreak: 'break-all' }}
                      >
                        {journeyId}
                      </div>
                      <button
                        onClick={copyCode}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 active:scale-95"
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ASSIGNABLE_ROLES.map(r => <RoleCard key={r} role={r} />)}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  )
}
