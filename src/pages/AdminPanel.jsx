import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, BarChart2, Activity, Cpu,
  RefreshCw, Ban, UserX, TrendingUp, CheckSquare,
  Search, X, AlertTriangle, ArrowLeft, Zap,
  Circle, Database, Clock, ChevronRight,
  Hash, Server, Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import useAdminStore from '../store/useAdminStore'
import useAuthStore from '../store/useAuthStore'
import { reportMetrics } from '../lib/clientMetrics'
import { AI_DAILY_LIMIT } from '../lib/constants'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const formatMB = (n) => n == null ? 'N/A' : `${(n / 1024 / 1024).toFixed(1)} MB`
const formatMs = (n) => n == null ? 'N/A' : `${n} ms`

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────

function Sk({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-white/6 ${className}`} />
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-3">{children}</p>
  )
}

function Badge({ children, color = 'emerald' }) {
  const styles = {
    emerald: { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' },
    red:     { background: 'rgba(244,63,94,0.12)',  color: '#f87171', border: '1px solid rgba(244,63,94,0.2)'  },
    amber:   { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' },
    violet:  { background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' },
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={styles[color] || styles.emerald}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────
// Admin sidebar
// ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'overview',    icon: Monitor,   label: 'Overview'     },
  { id: 'users',       icon: Users,     label: 'Users'        },
  { id: 'ai-usage',    icon: Zap,       label: 'AI Usage'     },
  { id: 'performance', icon: Cpu,       label: 'Performance'  },
  { id: 'activity',    icon: Activity,  label: 'Activity Log' },
]

function AdminSidebar({ active, onNav, user, onBack }) {
  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-20"
      style={{ background: 'rgba(8,8,12,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Brand */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
            <ShieldCheck size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Admin</p>
            <p className="text-amber-500/70 text-[10px] mt-0.5">PAL Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <SectionLabel>Monitor</SectionLabel>
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNav(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              active === id
                ? 'bg-amber-500/15 text-amber-300 font-medium'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Icon size={14} />
            {label}
            {active === id && <ChevronRight size={11} className="ml-auto text-amber-500/50" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 flex-shrink-0 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onBack}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={13} />
          Back to App
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-gray-300 text-xs font-medium truncate">{user?.username}</p>
            <p className="text-gray-700 text-[10px] truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle, onRefresh, loading, lastUpdated }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
    >
      <div>
        <h1 className="text-white font-semibold text-sm">{title}</h1>
        {subtitle && <p className="text-gray-600 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className="text-gray-700 text-xs hidden md:block">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Overview page
// ─────────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, color, sub }) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15"
        style={{ background: color, transform: 'translate(40%,-40%)' }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs mb-2">{label}</p>
          <p className="text-2xl font-bold text-white leading-none">{value ?? '—'}</p>
          {sub && <p className="text-gray-700 text-xs mt-1.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function SystemStatus() {
  const items = [
    { label: 'Database',    status: 'Operational', color: '#10b981' },
    { label: 'Auth',        status: 'Operational', color: '#10b981' },
    { label: 'Realtime',    status: 'Operational', color: '#10b981' },
    { label: 'Storage',     status: 'Operational', color: '#10b981' },
    { label: 'Groq AI API', status: 'External',    color: '#f59e0b' },
  ]
  return (
    <div className="rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Server size={13} className="text-gray-500" />
          <p className="text-white text-xs font-medium">System Status</p>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {items.map(({ label, status, color }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <p className="text-gray-400 text-xs">{label}</p>
            <div className="flex items-center gap-1.5">
              <Circle size={6} fill={color} style={{ color }} />
              <span className="text-xs font-medium" style={{ color }}>{status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OverviewPage({ stats, loading, onRefresh }) {
  const [lastUpdated, setLastUpdated] = useState(null)
  const refresh = () => { onRefresh(); setLastUpdated(new Date()) }

  return (
    <>
      <TopBar
        title="System Overview"
        subtitle="Real-time platform metrics and status"
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stat tiles */}
        <div>
          <SectionLabel>Platform Metrics</SectionLabel>
          {loading && !stats ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <Sk key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              <StatTile icon={Users}       label="Total Users"      value={stats?.totalUsers}      color="#8b5cf6" sub="registered accounts" />
              <StatTile icon={TrendingUp}  label="Journeys"         value={stats?.totalJourneys}   color="#10b981" sub="across all users"    />
              <StatTile icon={CheckSquare} label="Tasks"            value={stats?.totalTasks}      color="#f59e0b" sub="all nodes combined"   />
              <StatTile icon={Database}    label="Activity Events"  value={stats?.totalActivities} color="#3b82f6" sub="all-time audit log"   />
              <StatTile icon={Zap}         label="AI Calls Today"   value={stats?.aiCallsToday}    color="#ec4899" sub="Groq API requests"    />
            </div>
          )}
        </div>

        {/* Two-column: system status + quick info */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SystemStatus />

          <div className="rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Hash size={13} className="text-gray-500" />
                <p className="text-white text-xs font-medium">Stack Info</p>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { k: 'Frontend',    v: 'React 19 + Vite'     },
                { k: 'Database',    v: 'Supabase (Postgres)'  },
                { k: 'Auth',        v: 'Supabase Auth'        },
                { k: 'AI Provider', v: 'Groq / llama-3.1-8b'  },
                { k: 'Hosting',     v: 'Vercel (PWA)'         },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-gray-500 text-xs">{k}</p>
                  <p className="text-gray-300 text-xs font-mono">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Users page
// ─────────────────────────────────────────────────────────────────

function UsersPage({ users, loading, onRefresh, onBan, onForceLogout, currentUserId }) {
  const [search, setSearch]             = useState('')
  const [pendingLogout, setPendingLogout] = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleForceLogout = (userId) => {
    if (pendingLogout === userId) {
      onForceLogout(userId)
      setPendingLogout(null)
    } else {
      setPendingLogout(userId)
      setTimeout(() => setPendingLogout(p => p === userId ? null : p), 3000)
    }
  }

  const refresh = () => { onRefresh(); setLastUpdated(new Date()) }

  const activeCount = users.filter(u => !u.is_banned).length
  const bannedCount = users.filter(u => u.is_banned).length

  return (
    <>
      <TopBar
        title="User Management"
        subtitle={`${activeCount} active · ${bannedCount} banned`}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Summary chips */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Circle size={6} fill="#10b981" className="text-emerald-400" />
            <span className="text-emerald-400 font-medium">{activeCount} Active</span>
          </div>
          {bannedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <Circle size={6} fill="#f43f5e" className="text-red-400" />
              <span className="text-red-400 font-medium">{bannedCount} Banned</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 max-w-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="bg-transparent text-white text-xs placeholder:text-gray-600 focus:outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-600 hover:text-white"><X size={11} /></button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="grid gap-4 px-4 py-2.5 border-b border-white/5"
            style={{ gridTemplateColumns: 'minmax(140px,auto) 1fr auto auto auto auto' }}>
            {['User', 'Email', 'Designation', 'Joined', 'Status', 'Actions'].map(h => (
              <p key={h} className="text-gray-600 text-[10px] uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {loading && !users.length ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Sk key={i} className="h-10" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-sm">
              {search ? `No users match "${search}"` : 'No users found'}
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {filtered.map(u => (
                <div
                  key={u.id}
                  className="grid gap-4 items-center px-4 py-3 hover:bg-white/2 transition-colors"
                  style={{ gridTemplateColumns: 'minmax(140px,auto) 1fr auto auto auto auto' }}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: u.is_banned ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                        color:      u.is_banned ? '#f87171' : '#34d399',
                        border:     `1px solid ${u.is_banned ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
                      }}
                    >
                      {u.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <p className="text-white text-xs font-medium truncate">{u.username}</p>
                  </div>

                  <p className="text-gray-400 text-xs truncate">{u.email}</p>
                  <p className="text-gray-500 text-xs truncate">{u.designation || '—'}</p>
                  <p className="text-gray-600 text-xs whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </p>

                  <Badge color={u.is_banned ? 'red' : 'emerald'}>
                    {u.is_banned ? 'Banned' : 'Active'}
                  </Badge>

                  <div className="flex items-center gap-1">
                    {u.id === currentUserId ? (
                      <span className="text-gray-700 text-[10px] px-2">You</span>
                    ) : (
                      <>
                        <button
                          onClick={() => onBan(u.id, !u.is_banned)}
                          title={u.is_banned ? 'Unban user' : 'Ban user'}
                          className={`p-1.5 rounded-lg transition-all ${
                            u.is_banned
                              ? 'text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-gray-600 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          <Ban size={12} />
                        </button>
                        <button
                          onClick={() => handleForceLogout(u.id)}
                          title={pendingLogout === u.id ? 'Click again to confirm' : 'Force logout'}
                          className={`p-1.5 rounded-lg transition-all ${
                            pendingLogout === u.id
                              ? 'text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/30'
                              : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'
                          }`}
                        >
                          <UserX size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// AI Usage page
// ─────────────────────────────────────────────────────────────────

function AIUsagePage({ users, loading, onRefresh }) {
  const [lastUpdated, setLastUpdated] = useState(null)
  const refresh = () => { onRefresh(); setLastUpdated(new Date()) }

  const sorted     = [...users].sort((a, b) => b.aiUsageToday - a.aiUsageToday)
  const totalToday = users.reduce((s, u) => s + u.aiUsageToday, 0)
  const atLimit    = users.filter(u => u.aiUsageToday >= AI_DAILY_LIMIT).length

  const barColor = (count) => {
    if (count === 0)           return '#374151'
    if (count < AI_DAILY_LIMIT - 1) return '#10b981'
    if (count === AI_DAILY_LIMIT - 1) return '#f59e0b'
    return '#f43f5e'
  }

  return (
    <>
      <TopBar
        title="AI Usage"
        subtitle={`${totalToday} total calls today · ${atLimit} users at limit`}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Zap}   label="Total Calls Today" value={totalToday}    color="#ec4899" />
          <StatTile icon={Users} label="Users at Limit"    value={atLimit}       color="#f43f5e" />
          <StatTile icon={BarChart2} label="Daily Limit / User" value={AI_DAILY_LIMIT} color="#8b5cf6" sub="via Groq API" />
        </div>

        {/* Per-user table */}
        <div>
          <SectionLabel>Per-User Breakdown — Today</SectionLabel>
          <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="grid grid-cols-[1fr_1fr_200px_auto] gap-4 px-4 py-2.5 border-b border-white/5">
              {['User', 'Email', 'Usage', 'Remaining'].map(h => (
                <p key={h} className="text-gray-600 text-[10px] uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {loading && !users.length ? (
              <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="py-12 text-center text-gray-600 text-sm">No users found</div>
            ) : (
              <div className="divide-y divide-white/4">
                {sorted.map(u => {
                  const pct       = Math.min(100, (u.aiUsageToday / AI_DAILY_LIMIT) * 100)
                  const remaining = Math.max(0, AI_DAILY_LIMIT - u.aiUsageToday)
                  const color     = barColor(u.aiUsageToday)
                  return (
                    <div key={u.id} className="grid grid-cols-[1fr_1fr_200px_auto] gap-4 items-center px-4 py-3 hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                          style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-white text-xs font-medium truncate">{u.username}</p>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{u.email}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-xs font-bold w-5 text-right" style={{ color }}>
                          {u.aiUsageToday}
                        </span>
                      </div>
                      <div className="text-right">
                        {remaining === 0
                          ? <Badge color="red">At limit</Badge>
                          : <span className="text-gray-500 text-xs">{remaining} left</span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Performance page
// ─────────────────────────────────────────────────────────────────

function PerformancePage({ metrics, loading, onRefresh }) {
  const [lastUpdated, setLastUpdated] = useState(null)
  const refresh = () => { onRefresh(); setLastUpdated(new Date()) }

  const queueClass = (n) => {
    if (n == null || n === 0) return 'text-gray-600'
    if (n <= 5)               return 'text-amber-400'
    return 'text-red-400'
  }

  const avgHeap = metrics.length
    ? (metrics.reduce((s, m) => s + (m.js_heap_used || 0), 0) / metrics.length / 1024 / 1024).toFixed(1)
    : null
  const avgLoad = metrics.length
    ? Math.round(metrics.filter(m => m.page_load_ms).reduce((s, m) => s + m.page_load_ms, 0) / metrics.filter(m => m.page_load_ms).length)
    : null

  return (
    <>
      <TopBar
        title="Client Performance"
        subtitle="Browser-reported metrics across all sessions"
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Aggregate stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Monitor}  label="Sessions Reported" value={metrics.length}               color="#3b82f6" />
          <StatTile icon={Cpu}      label="Avg JS Heap"       value={avgHeap ? `${avgHeap} MB` : '—'} color="#10b981" sub="Chrome only" />
          <StatTile icon={Clock}    label="Avg Load Time"     value={avgLoad ? `${avgLoad}ms` : '—'}  color="#f59e0b" />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-amber-400"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <AlertTriangle size={12} />
          JS Heap metrics rely on <code className="font-mono">performance.memory</code> — available in Chrome only. Other browsers report N/A.
        </div>

        <div>
          <SectionLabel>Latest Sessions (up to 200)</SectionLabel>
          <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="grid gap-3 px-4 py-2.5 border-b border-white/5"
              style={{ gridTemplateColumns: '1fr auto auto auto auto auto' }}>
              {['User', 'Reported', 'Heap Used', 'Heap Total', 'Load Time', 'Queue'].map(h => (
                <p key={h} className="text-gray-600 text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</p>
              ))}
            </div>
            {loading && !metrics.length ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
            ) : metrics.length === 0 ? (
              <div className="py-12 text-center text-gray-600 text-sm">No metrics reported yet — open the app to generate data</div>
            ) : (
              <div className="divide-y divide-white/4">
                {metrics.map(m => (
                  <div key={m.id}
                    className="grid gap-3 items-center px-4 py-3 hover:bg-white/2 transition-colors"
                    style={{ gridTemplateColumns: '1fr auto auto auto auto auto' }}>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{m.profile?.username ?? 'Unknown'}</p>
                      <p className="text-gray-700 text-[10px] truncate">{m.profile?.email}</p>
                    </div>
                    <p className="text-gray-500 text-xs whitespace-nowrap">{timeAgo(m.reported_at)}</p>
                    <p className="text-gray-300 text-xs font-mono">{formatMB(m.js_heap_used)}</p>
                    <p className="text-gray-400 text-xs font-mono">{formatMB(m.js_heap_total)}</p>
                    <p className="text-gray-400 text-xs font-mono">{formatMs(m.page_load_ms)}</p>
                    <p className={`text-xs font-semibold ${queueClass(m.sync_queue_depth)}`}>
                      {m.sync_queue_depth ?? 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Activity Log page
// ─────────────────────────────────────────────────────────────────

function ActivityLogPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { supabase } = await import('../supabaseClient')
    const { data } = await supabase
      .from('activities')
      .select('id, journey_id, username, action, timestamp')
      .order('timestamp', { ascending: false })
      .limit(200)
    setActivities(data || [])
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <>
      <TopBar
        title="Activity Log"
        subtitle="Last 200 system-wide events across all journeys"
        onRefresh={load}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2.5 border-b border-white/5">
            {['User', 'Action', 'Time'].map(h => (
              <p key={h} className="text-gray-600 text-[10px] uppercase tracking-wider">{h}</p>
            ))}
          </div>
          {loading && !activities.length ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-sm">No activity recorded yet</div>
          ) : (
            <div className="divide-y divide-white/4">
              {activities.map(a => (
                <div key={a.id} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 hover:bg-white/2 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-[10px] font-bold">
                      {a.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-200 text-xs font-medium">{a.username} </span>
                    <span className="text-gray-400 text-xs">{a.action}</span>
                  </div>
                  <p className="text-gray-600 text-xs whitespace-nowrap">{timeAgo(a.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [page, setPage] = useState('overview')
  const navigate        = useNavigate()
  const user            = useAuthStore(s => s.user)
  const store           = useAdminStore()

  // Load data whenever page changes
  useEffect(() => {
    if (page === 'overview')    store.loadOverviewStats()
    if (page === 'users')       store.loadUsersWithUsage()
    if (page === 'ai-usage')    store.loadUsersWithUsage()
    if (page === 'performance') store.loadRecentMetrics()
  }, [page])

  // Force-push own metrics on mount
  useEffect(() => {
    if (user?.id) reportMetrics(user.id, true)
  }, [user?.id])

  const handleBan = async (userId, isBanned) => {
    const error = await store.banUser(userId, isBanned)
    if (error) toast.error(`Failed: ${error.message}`)
    else toast.success(isBanned ? 'User banned' : 'User unbanned')
  }

  const handleForceLogout = async (userId) => {
    const error = await store.forceLogout(userId)
    if (error) toast.error(`Failed: ${error.message}`)
    else toast.success('Force logout sent — user will be signed out within seconds')
  }

  return (
    <div
      className="flex min-h-screen text-white"
      style={{ background: '#050508' }}
    >
      <AdminSidebar
        active={page}
        onNav={setPage}
        user={user}
        onBack={() => navigate('/dashboard')}
      />

      {/* Main content */}
      <div className="ml-56 flex-1 flex flex-col min-h-screen overflow-hidden">

        {page === 'overview' && (
          <OverviewPage
            stats={store.stats}
            loading={store.loading}
            onRefresh={() => store.loadOverviewStats()}
          />
        )}
        {page === 'users' && (
          <UsersPage
            users={store.usersWithUsage}
            loading={store.loading}
            onRefresh={() => store.loadUsersWithUsage()}
            onBan={handleBan}
            onForceLogout={handleForceLogout}
            currentUserId={user?.id}
          />
        )}
        {page === 'ai-usage' && (
          <AIUsagePage
            users={store.usersWithUsage}
            loading={store.loading}
            onRefresh={() => store.loadUsersWithUsage()}
          />
        )}
        {page === 'performance' && (
          <PerformancePage
            metrics={store.recentMetrics}
            loading={store.loading}
            onRefresh={() => store.loadRecentMetrics()}
          />
        )}
        {page === 'activity' && (
          <ActivityLogPage />
        )}

      </div>
    </div>
  )
}
