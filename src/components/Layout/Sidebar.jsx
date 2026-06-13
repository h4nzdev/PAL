import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Settings, Plus, LogOut, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useProjectStore from '../../store/useProjectStore'
import useAuthStore from '../../store/useAuthStore'
import logo from '../../assets/logo.png'
import { COLOR_HEX } from '../../lib/colors'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar,        label: 'Calendar',  path: '/calendar'  },
  { icon: Settings,        label: 'Settings',  path: '/settings'  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const journeys = useProjectStore(useShallow(s => s.journeys))
  const { user, logout } = useAuthStore()

  // Track which journeys are expanded in the sidebar
  const [expanded, setExpanded] = useState({})

  const isActive        = (path) => location.pathname === path
  const isJourneyActive = (id)   => location.pathname.startsWith(`/journey/${id}`)
  const isChatActive    = (id)   => location.pathname === `/journey/${id}/chat`

  const toggleExpand = (id, e) => {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="w-52 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <img src={logo} alt="pal" className="h-6 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive(path)
                ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}

        {/* New Journey shortcut */}
        <button
          onClick={() => navigate('/new-journey')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all mt-1"
        >
          <Plus size={15} />
          New Journey
        </button>

        {/* Journey list */}
        {journeys.length > 0 && (
          <div className="pt-5">
            <p className="text-gray-700 text-[10px] px-3 mb-2 uppercase tracking-widest font-medium">Journeys</p>
            {journeys.map(j => {
              const hex        = COLOR_HEX[j.color] || COLOR_HEX.emerald
              const isActive   = isJourneyActive(j.id)
              const isOpen     = expanded[j.id] || isActive
              const chatActive = isChatActive(j.id)

              return (
                <div key={j.id}>
                  {/* Journey row */}
                  <div
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      isActive && !chatActive ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                    }`}
                    onClick={() => navigate(`/journey/${j.id}`)}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
                    <span className="truncate flex-1 text-left">{j.name}</span>
                    <button
                      onClick={(e) => toggleExpand(j.id, e)}
                      className="flex-shrink-0 text-gray-700 hover:text-gray-400 transition-colors p-0.5"
                    >
                      {isOpen
                        ? <ChevronDown size={11} />
                        : <ChevronRight size={11} />
                      }
                    </button>
                  </div>

                  {/* Sub-nav: Chat link */}
                  {isOpen && (
                    <button
                      onClick={() => navigate(`/journey/${j.id}/chat`)}
                      className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-xs transition-all ${
                        chatActive
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <MessageCircle size={12} />
                      Team Chat
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg group">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.username}</p>
            <p className="text-gray-600 text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
