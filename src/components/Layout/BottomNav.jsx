import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Plus, MessageCircle, Settings, X, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useProjectStore from '../../store/useProjectStore'
import { COLOR_HEX } from '../../lib/colors'

export default function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const journeys  = useProjectStore(useShallow(s => s.journeys))
  const [journeySheet, setJourneySheet] = useState(false)

  // Detect current journeyId from URL so the Chat button can deep-link
  const journeyMatch    = location.pathname.match(/^\/journey\/([^/]+)/)
  const currentJourneyId = journeyMatch?.[1]

  const handleChat = () => {
    if (currentJourneyId) {
      navigate(`/journey/${currentJourneyId}/chat`)
    } else if (journeys.length > 0) {
      navigate(`/journey/${journeys[0].id}/chat`)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {/* Dashboard */}
        <NavBtn
          icon={LayoutDashboard}
          label="Home"
          active={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
        />

        {/* Calendar */}
        <NavBtn
          icon={Calendar}
          label="Calendar"
          active={location.pathname === '/calendar'}
          onClick={() => navigate('/calendar')}
        />

        {/* New Journey — center FAB */}
        <button
          onClick={() => navigate('/new-journey')}
          className="w-13 h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 -mt-4"
          style={{ width: 52, height: 52 }}
          aria-label="New Journey"
        >
          <Plus size={22} className="text-white" />
        </button>

        {/* Chat / Journeys */}
        <NavBtn
          icon={MessageCircle}
          label="Chat"
          active={location.pathname.includes('/chat')}
          onClick={journeys.length > 1 ? () => setJourneySheet(true) : handleChat}
        />

        {/* Settings */}
        <NavBtn
          icon={Settings}
          label="Settings"
          active={location.pathname === '/settings'}
          onClick={() => navigate('/settings')}
        />
      </nav>

      {/* Journey picker sheet (when user has multiple journeys and taps Chat) */}
      {journeySheet && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setJourneySheet(false)}
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] rounded-t-2xl"
            style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-white font-semibold text-sm">Open Team Chat</p>
              <button onClick={() => setJourneySheet(false)} className="text-gray-500 hover:text-white transition-colors p-1">
                <X size={17} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-3 space-y-1">
              {journeys.map(j => {
                const hex = COLOR_HEX[j.color] || COLOR_HEX.emerald
                return (
                  <button
                    key={j.id}
                    onClick={() => { navigate(`/journey/${j.id}/chat`); setJourneySheet(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/5 active:bg-white/8"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hex }} />
                    <span className="text-white text-sm flex-1 truncate">{j.name}</span>
                    <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[56px] ${
        active ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-300'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
      <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-gray-600'}`}>{label}</span>
      {active && <span className="w-1 h-1 rounded-full bg-emerald-400 -mt-0.5" />}
    </button>
  )
}
