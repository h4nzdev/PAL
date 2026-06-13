import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderOpen, Trash2, Search, TrendingUp, CheckSquare, X,
  Flame, Target, AlertTriangle, Clock, Rocket, CalendarDays,
  Settings, BarChart2, ChevronRight, ArrowRight,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import Sidebar from '../components/Layout/Sidebar'
import ProgressRing from '../components/Dashboard/ProgressRing'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'
import mascot from '../assets/mascot.png'
import { COLOR_HEX, COLOR_CLASSES } from '../lib/colors'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function MascotBubble({ journeyCount }) {
  const [dismissed, setDismissed] = useState(false)
  const messages = journeyCount === 0
    ? ['Ready to map your first journey? Click "New Journey" to begin! 🚀']
    : ['Looking great! Click any journey to open its workspace. 🗺️', 'Add sections inside a journey to build a full roadmap!', 'Keep checking off tasks — you\'re on a roll! ✅']
  const [msg] = useState(() => messages[Math.floor(Math.random() * messages.length)])
  if (dismissed) return null
  return (
    <div className="fixed bottom-6 right-6 flex items-end gap-3 z-30">
      <div className="relative rounded-2xl rounded-br-sm px-4 py-3 max-w-[210px] shadow-2xl" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setDismissed(true)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors" style={{ background: '#1f2937' }}>
          <X size={10} />
        </button>
        <p className="text-gray-200 text-xs leading-relaxed">{msg}</p>
        <div className="absolute -right-2 bottom-3 w-0 h-0" style={{ borderTop: '6px solid transparent', borderLeft: '8px solid rgba(255,255,255,0.08)' }} />
        <div className="absolute -right-[7px] bottom-3 w-0 h-0" style={{ borderTop: '6px solid transparent', borderLeft: '8px solid #111827' }} />
      </div>
      <img src={mascot} alt="pal mascot" className="w-20 h-20 object-contain drop-shadow-xl select-none" />
    </div>
  )
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
      className="group flex items-center gap-3 p-3.5 rounded-xl transition-all text-left"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.background = `${color}08` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ background: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-none mb-0.5 group-hover:text-white transition-colors">{label}</p>
        <p className="text-gray-600 text-xs">{sub}</p>
      </div>
      <ArrowRight size={13} className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
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

  const { journeys, activities, nodes, deleteJourney } = useProjectStore(
    useShallow(s => ({ journeys: s.journeys, activities: s.activities, nodes: s.nodes, deleteJourney: s.deleteJourney }))
  )
  const [search, setSearch] = useState('')

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

  const QUICK_ACTIONS = [
    { icon: Rocket,       label: 'New Journey',     sub: 'Start a new project roadmap',   color: '#10b981', onClick: () => navigate('/new-journey') },
    { icon: CalendarDays, label: 'Calendar',         sub: 'View tasks with due dates',      color: '#3b82f6', onClick: () => navigate('/calendar') },
    { icon: Settings,     label: 'Team & Settings',  sub: 'Manage profile and workspace',   color: '#8b5cf6', onClick: () => navigate('/settings') },
    { icon: BarChart2,    label: 'Activity Log',     sub: 'See recent team actions',        color: '#f59e0b', onClick: () => activityRef.current?.scrollIntoView({ behavior: 'smooth' }) },
  ]

  return (
    <div className="flex min-h-screen text-white" style={{ background: '#030712' }}>
      <Sidebar />

      <main className="ml-52 flex-1 p-8 fade-up" style={{ maxWidth: 1200 }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gray-600 text-xs mb-1">{todayLabel}</p>
            <h1 className="text-2xl font-bold text-white">{getGreeting()}, {user?.username}.</h1>
            <p className="text-gray-500 text-sm mt-1">
              {journeys.length === 0
                ? 'Create your first journey to get started.'
                : `You have ${journeys.length} active journey${journeys.length !== 1 ? 's' : ''} · ${totalCompleted} tasks done.`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {streak > 0 && <StreakBadge streak={streak} />}
            <button
              onClick={() => navigate('/new-journey')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transform"
            >
              <Plus size={16} /> New Journey
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-4 mb-6 stagger">
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
            sub={totalTasks > 0 ? `${totalTasks} tasks tracked` : 'No tasks yet'}
            color="#3b82f6"
            accent={completionRate >= 80 ? 'Excellent!' : completionRate >= 50 ? 'Good progress' : completionRate > 0 ? 'Keep going!' : ''}
          />
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={streak}
            sub="consecutive active days"
            color="#f97316"
            accent={streak >= 7 ? '🔥 On fire!' : streak >= 3 ? 'Building momentum' : streak > 0 ? 'Keep it up!' : 'Complete a task to start'}
          />
        </div>

        {/* ── Insight row ── */}
        {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6 fade-up">
            <InsightCard type="overdue"   tasks={overdueTasks}  journeys={journeys} nodes={nodes} />
            <InsightCard type="upcoming"  tasks={upcomingTasks} journeys={journeys} nodes={nodes} />
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="mb-8 fade-up">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(qa => <QuickActionCard key={qa.label} {...qa} />)}
          </div>
        </div>

        {/* ── Journeys ── */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest flex-shrink-0">Journeys</h2>
          {journeys.length > 2 && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Search size={13} className="text-gray-500 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search journeys…"
                className="bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-600 hover:text-white">
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
            <p className="text-gray-600 text-sm mb-6">Create a journey and start building your roadmap.</p>
            <button
              onClick={() => navigate('/new-journey')}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              Create your first journey →
            </button>
          </div>
        ) : filteredJourneys.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No journeys match "{search}"</div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {filteredJourneys.map(j => {
              const progress  = getProgress(j.id)
              const hex       = COLOR_HEX[j.color] || COLOR_HEX.emerald
              const cls       = COLOR_CLASSES[j.color] || COLOR_CLASSES.emerald
              const taskCount = (nodes[j.id] || []).filter(n => n.type === 'task').length
              const doneCount = (nodes[j.id] || []).filter(n => n.type === 'task' && n.checked).length
              const sections  = (nodes[j.id] || []).filter(n => n.type === 'header').length

              return (
                <div
                  key={j.id}
                  className="group relative rounded-2xl border border-white/8 hover:border-white/15 transition-all overflow-hidden cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${hex}, transparent)` }} />

                  <button onClick={() => navigate(`/journey/${j.id}`)} className="w-full text-left p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border mb-2 ${cls.bg} ${cls.text} ${cls.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} />
                          {j.color || 'emerald'}
                        </div>
                        <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-emerald-400 transition-colors truncate">
                          {j.name}
                        </h3>
                        <p className="text-gray-700 text-xs mt-1">
                          {sections} section{sections !== 1 ? 's' : ''} · created {new Date(j.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ProgressRing progress={progress} size={44} />
                    </div>

                    <div className="space-y-2">
                      <div className="h-1 rounded-full w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: hex }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">{doneCount}/{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                        <span className="text-xs font-semibold" style={{ color: hex }}>{progress}%</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => deleteJourney(j.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all" style={{ marginRight: progress > 0 ? 24 : 0 }}>
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Activity feed ── */}
        {activities.length > 0 && (
          <div className="mt-10 fade-up" ref={activityRef}>
            <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="rounded-2xl overflow-hidden border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {activities.slice(0, 10).map((a, i) => (
                <div
                  key={a.id}
                  className={`px-5 py-3.5 flex items-center gap-3 ${i < Math.min(activities.length, 10) - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-xs font-semibold">{a.username?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-gray-400 text-sm flex-1 min-w-0 truncate">
                    <span className="text-gray-200">{a.username}</span> {a.action}
                  </span>
                  <span className="text-gray-700 text-xs flex-shrink-0">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <MascotBubble journeyCount={journeys.length} />
    </div>
  )
}
