import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderOpen, Trash2, Search, TrendingUp, CheckSquare,
  Flame, Target, AlertTriangle, Clock, Rocket, CalendarDays,
  Settings, BarChart2, ChevronRight, ArrowRight, Hash, X, LogIn,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import ProgressRing from '../components/Dashboard/ProgressRing'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'
import { COLOR_HEX, COLOR_CLASSES } from '../lib/colors'
import MascotAvatar from '../components/Dashboard/MascotAvatar'
import mascotLoad from '../assets/mascot-load.png'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}


function StatCard({ icon: Icon, label, value, sub, color = '#10b981', accent }) {
  return (
    <div className="rounded-2xl p-5 border border-white/8 relative overflow-hidden fade-up" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-30" style={{ background: color, transform: 'translate(35%, -35%)' }} />
      <div className="relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-3xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-gray-600 text-xs mt-1.5">{sub}</p>}
        {accent && <p className="text-xs mt-1.5 font-medium" style={{ color }}>{accent}</p>}
      </div>
    </div>
  )
}

function InsightCard({ type, tasks, journeys, nodes, onNavigate }) {
  const isOverdue = type === 'overdue'
  const color     = isOverdue ? '#f43f5e' : '#f59e0b'
  const Icon      = isOverdue ? AlertTriangle : Clock
  const label     = isOverdue ? 'Overdue Tasks' : 'Due This Week'
  const empty     = isOverdue ? 'All tasks are on track!' : 'Nothing due this week.'

  const findJourneyName = (journeyId) => journeys.find(j => j.id === journeyId)?.name || 'Unknown'

  return (
    <div
      className="rounded-2xl p-4 border relative overflow-hidden"
      style={{
        background: isOverdue ? 'rgba(244,63,94,0.04)' : 'rgba(245,158,11,0.04)',
        borderColor: isOverdue ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
        {tasks.length > 0 && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color }}
          >
            {tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-600 text-xs">{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-gray-400 truncate flex-1">{t.content}</span>
              {!isOverdue && t.dueDate && (
                <span className="text-gray-600 flex-shrink-0">{t.dueDate}</span>
              )}
              {isOverdue && t.dueDate && (
                <span className="flex-shrink-0" style={{ color }}>
                  {t.dueDate}
                </span>
              )}
            </div>
          ))}
          {tasks.length > 3 && (
            <p className="text-gray-700 text-xs pt-0.5">+{tasks.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  )
}

function QuickActionCard({ icon: Icon, label, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-3xl transition-all text-left min-h-[110px]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}35`;
        e.currentTarget.style.background = `${color}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: `${color}18` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-snug mb-1 group-hover:text-white transition-colors">
          {label}
        </p>
        <p className="text-gray-500 text-xs leading-snug">{sub}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-gray-500 group-hover:text-gray-300 transition-all flex-shrink-0"
      />
    </button>
  );
}

function Sk({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
      {/* Mascot row */}
      <div className="flex items-end gap-3 mb-8">
        <img src={mascotLoad} alt="Loading" className="w-16 h-16 md:w-20 md:h-20 object-contain flex-shrink-0 mascot-float drop-shadow-lg" />
        <div
          className="flex-1 rounded-2xl px-4 py-3 space-y-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px' }}
        >
          <Sk className="h-4 w-4/5 rounded-lg" />
          <Sk className="h-4 w-2/3 rounded-lg" />
          <Sk className="h-3 w-24 rounded-lg" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2.5">
          <Sk className="h-2.5 w-28 rounded-md" />
          <Sk className="h-7 w-48 rounded-lg" />
          <Sk className="h-2.5 w-56 rounded-md" />
        </div>
        <Sk className="h-9 w-28 rounded-xl" />
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 md:p-5 border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Sk className="w-8 h-8 rounded-xl mb-3" />
            <Sk className="h-2.5 w-16 rounded-md mb-2.5" />
            <Sk className="h-7 w-10 rounded-lg mb-1.5" />
            <Sk className="h-2.5 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {/* Quick Actions 2×2 */}
      <div className="mb-5">
        <Sk className="h-2.5 w-24 rounded-md mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl p-4 border border-white/6 flex items-center gap-3 min-h-[100px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Sk className="w-10 h-10 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-3.5 w-20 rounded-md" />
                <Sk className="h-2.5 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journeys 2×2 */}
      <div>
        <Sk className="h-2.5 w-16 rounded-md mb-4" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Sk className="h-0.5 w-full rounded-none" />
              <div className="p-4 md:p-5 space-y-3">
                <Sk className="h-5 w-12 rounded-full" />
                <Sk className="h-3.5 w-4/5 rounded-md" />
                <Sk className="h-2.5 w-1/2 rounded-md" />
                <Sk className="h-1 w-full rounded-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StreakBadge({ streak }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
    >
      <Flame size={14} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' }} />
      <span className="text-orange-300 text-sm font-bold">{streak}</span>
      <span className="text-orange-500 text-xs">day streak</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate     = useNavigate()
  const activityRef  = useRef(null)
  const user         = useAuthStore(s => s.user)
  const streak       = useAuthStore(s => s.streak)

  const { journeys, activities, nodes, deleteJourney, loading } = useProjectStore(
    useShallow(s => ({ journeys: s.journeys, activities: s.activities, nodes: s.nodes, deleteJourney: s.deleteJourney, loading: s.loading }))
  )
  const [search, setSearch] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)

  const allTasks      = useMemo(() => Object.values(nodes).flat(), [nodes])
  const totalTasks    = allTasks.filter(n => n.type === 'task').length
  const totalCompleted = allTasks.filter(n => n.type === 'task' && n.checked).length
  const completionRate = totalTasks > 0 ? Math.round(totalCompleted / totalTasks * 100) : 0

  const todayStr   = new Date().toISOString().split('T')[0]
  const in7daysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const overdueTasks  = useMemo(() =>
    allTasks.filter(n => n.type === 'task' && !n.checked && n.dueDate && n.dueDate < todayStr),
    [allTasks, todayStr]
  )
  const upcomingTasks = useMemo(() =>
    allTasks.filter(n => n.type === 'task' && !n.checked && n.dueDate && n.dueDate >= todayStr && n.dueDate <= in7daysStr),
    [allTasks, todayStr, in7daysStr]
  )

  const filteredJourneys = useMemo(() =>
    journeys.filter(j => j.name.toLowerCase().includes(search.toLowerCase())),
    [journeys, search]
  )

  const getProgress = (journeyId) => {
    const jnodes = nodes[journeyId] || []
    const tasks  = jnodes.filter(n => n.type === 'task')
    if (!tasks.length) return 0
    return Math.round(tasks.filter(t => t.checked).length / tasks.length * 100)
  }

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const handleJoin = () => {
    const code = joinCode.trim()
    if (!code) return
    navigate(`/journey/${code}`)
    setJoinCode('')
    setJoinOpen(false)
  }

  const QUICK_ACTIONS = [
    { icon: Rocket,       label: 'New Journey',     sub: 'Start a new project roadmap',   color: '#10b981', onClick: () => navigate('/new-journey') },
    { icon: CalendarDays, label: 'Calendar',         sub: 'View tasks with due dates',      color: '#3b82f6', onClick: () => navigate('/calendar') },
    { icon: Settings,     label: 'Team & Settings',  sub: 'Manage profile and workspace',   color: '#8b5cf6', onClick: () => navigate('/settings') },
    { icon: BarChart2,    label: 'Activity Log',     sub: 'See recent team actions',        color: '#f59e0b', onClick: () => activityRef.current?.scrollIntoView({ behavior: 'smooth' }) },
  ]

  return (
    <div
      className="flex min-h-screen text-white"
      style={{ background: "var(--bg-base)" }}
    >
      <Sidebar />

      <main className="md:ml-52 flex-1 overflow-y-auto">
        {loading ? <DashboardSkeleton /> : (
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8 fade-up">
          {/* ── Mascot ── */}
          <MascotAvatar journeys={journeys} nodes={nodes} />

          {/* ── Header ── */}
          <div className="mb-8">
            <p className="text-gray-600 text-xs tracking-wide mb-2">{todayLabel}</p>
            <div className="flex items-center gap-3 mb-4">
              {streak > 0 && <StreakBadge streak={streak} />}
              <button
                onClick={() => navigate("/new-journey")}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transform whitespace-nowrap"
              >
                <Plus size={15} /> New Journey
              </button>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-2">
              {getGreeting()},{' '}
              <span className="text-emerald-400">{user?.username}</span>.
            </h1>
            <p className="text-gray-500 text-sm">
              {journeys.length === 0
                ? "Create your first journey to get started."
                : `You have ${journeys.length} active journey${journeys.length !== 1 ? "s" : ""} · ${totalCompleted} tasks done.`}
            </p>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 gap-4 mb-6 stagger">
            <StatCard
              icon={TrendingUp}
              label="Active Journeys"
              value={journeys.length}
              sub="across all projects"
              color="#10b981"
            />
            <StatCard
              icon={CheckSquare}
              label="Tasks Completed"
              value={totalCompleted}
              sub={`of ${totalTasks} total`}
              color="#f59e0b"
            />
            <StatCard
              icon={Target}
              label="Completion Rate"
              value={`${completionRate}%`}
              sub={
                totalTasks > 0 ? `${totalTasks} tasks tracked` : "No tasks yet"
              }
              color="#3b82f6"
              accent={
                completionRate >= 80
                  ? "Excellent!"
                  : completionRate >= 50
                    ? "Good progress"
                    : completionRate > 0
                      ? "Keep going!"
                      : ""
              }
            />
            <StatCard
              icon={Flame}
              label="Day Streak"
              value={streak}
              sub="consecutive active days"
              color="#f97316"
              accent={
                streak >= 7
                  ? "🔥 On fire!"
                  : streak >= 3
                    ? "Building momentum"
                    : streak > 0
                      ? "Keep it up!"
                      : "Complete a task to start"
              }
            />
          </div>

          {/* ── Insight row ── */}
          {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-6 fade-up">
              <InsightCard
                type="overdue"
                tasks={overdueTasks}
                journeys={journeys}
                nodes={nodes}
              />
              <InsightCard
                type="upcoming"
                tasks={upcomingTasks}
                journeys={journeys}
                nodes={nodes}
              />
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div className="mb-4 fade-up">
            <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((qa) => (
                <QuickActionCard key={qa.label} {...qa} />
              ))}
            </div>
          </div>

          {/* ── Join by Code ── */}
          <div className="mb-8 fade-up">
            {!joinOpen ? (
              <button
                onClick={() => setJoinOpen(true)}
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors px-1 py-1"
              >
                <Hash size={12} />
                Have an invite code? Join a journey →
              </button>
            ) : (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 max-w-md"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Hash size={13} className="text-gray-600 flex-shrink-0" />
                <input
                  autoFocus
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                    if (e.key === "Escape") setJoinOpen(false);
                  }}
                  placeholder="Paste invite code…"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-700 focus:outline-none font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.25)",
                  }}
                >
                  <LogIn size={12} /> Join
                </button>
                <button
                  onClick={() => {
                    setJoinOpen(false);
                    setJoinCode("");
                  }}
                  className="text-gray-700 hover:text-gray-400 p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Journeys ── */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-gray-500 text-xs uppercase tracking-widest flex-shrink-0">
              Journeys
            </h2>
            {journeys.length > 2 && (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-xs"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Search size={13} className="text-gray-500 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search journeys…"
                  className="bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-600 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {journeys.length === 0 ? (
            <div className="rounded-2xl p-16 text-center border border-dashed border-white/8">
              <FolderOpen className="mx-auto text-gray-700 mb-4" size={40} />
              <p className="text-gray-400 font-medium mb-1">No journeys yet</p>
              <p className="text-gray-600 text-sm mb-6">
                Create a journey and start building your roadmap.
              </p>
              <button
                onClick={() => navigate("/new-journey")}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                Create your first journey →
              </button>
            </div>
          ) : filteredJourneys.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No journeys match "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 stagger">
              {filteredJourneys.map((j) => {
                const progress = getProgress(j.id);
                const hex = COLOR_HEX[j.color] || COLOR_HEX.emerald;
                const cls = COLOR_CLASSES[j.color] || COLOR_CLASSES.emerald;
                const taskCount = (nodes[j.id] || []).filter(
                  (n) => n.type === "task",
                ).length;
                const doneCount = (nodes[j.id] || []).filter(
                  (n) => n.type === "task" && n.checked,
                ).length;
                const sections = (nodes[j.id] || []).filter(
                  (n) => n.type === "header",
                ).length;

                return (
                  <div
                    key={j.id}
                    className="group relative rounded-2xl border border-white/8 hover:border-white/15 transition-all overflow-hidden cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div
                      className="h-0.5 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${hex}, transparent)`,
                      }}
                    />

                    <button
                      onClick={() => navigate(`/journey/${j.id}`)}
                      className="w-full text-left p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border mb-2 ${cls.bg} ${cls.text} ${cls.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cls.dot}`}
                            />
                            {j.color || "emerald"}
                          </div>
                          <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-emerald-400 transition-colors truncate">
                            {j.name}
                          </h3>
                          <p className="text-gray-700 text-xs mt-1">
                            {sections} section{sections !== 1 ? "s" : ""} ·
                            created {new Date(j.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ProgressRing progress={progress} size={44} />
                      </div>

                      <div className="space-y-2">
                        <div
                          className="h-1 rounded-full w-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%`, background: hex }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">
                            {doneCount}/{taskCount} task
                            {taskCount !== 1 ? "s" : ""}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: hex }}
                          >
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => deleteJourney(j.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all"
                      style={{ marginRight: progress > 0 ? 24 : 0 }}
                    >
                      <ChevronRight size={14} className="text-gray-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Activity feed ── */}
          {activities.length > 0 && (
            <div className="mt-10 fade-up" ref={activityRef}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-500 text-xs uppercase tracking-widest">
                  Recent Activity
                </h2>
                {activities.length > 5 && (
                  <button
                    onClick={() => setShowAllActivity(v => !v)}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showAllActivity ? 'Show less' : `See all ${activities.length}`}
                  </button>
                )}
              </div>
              <div
                className="rounded-2xl overflow-hidden border border-white/5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {(showAllActivity ? activities : activities.slice(0, 5)).map((a, i, arr) => (
                  <div
                    key={a.id}
                    className={`px-5 py-3.5 flex items-center gap-3 ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-xs font-semibold">
                        {a.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm flex-1 min-w-0 truncate">
                      <span className="text-gray-200">{a.username}</span>{" "}
                      {a.action}
                    </span>
                    <span className="text-gray-700 text-xs flex-shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </main>

    </div>
  );
}
