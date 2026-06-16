import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import useProjectStore from './store/useProjectStore'
import useThemeStore from './store/useThemeStore'
import { Toaster } from 'sonner'
import PWAPrompt from './components/UI/PWAPrompt'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import NewJourney from './pages/NewJourney'
import Workspace from './pages/Workspace'
import SectionRoadmap from './pages/SectionRoadmap'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import JourneyChat from './pages/JourneyChat'
import JourneyTeam from './pages/JourneyTeam'
import BottomNav from './components/Layout/BottomNav'

// Applies the persisted theme class to <html> on every render
function ThemeInit() {
  const theme = useThemeStore(s => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])
  return null
}

function Guard({ children }) {
  const user = useAuthStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
}

function GuestGuard({ children }) {
  const user = useAuthStore(s => s.user)
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AuthedBottomNav() {
  const user = useAuthStore(s => s.user)
  return user ? <BottomNav /> : null
}

// Initialises auth session + loads project data whenever the user changes
function AppInit({ children }) {
  const init      = useAuthStore(s => s.init)
  const user      = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const loadData  = useProjectStore(s => s.loadData)
  const syncData  = useProjectStore(s => s.syncData)

  useEffect(() => { init() }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user?.id])

  useEffect(() => {
    const handleOnline = () => {
      if (localStorage.getItem('pal-auto-sync') !== 'false') {
        syncData()
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <p className="text-gray-500 text-sm">Loading JourneyPad…</p>
        </div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <ThemeInit />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9',
            },
          }}
        />
        <PWAPrompt />
        <AuthedBottomNav />
        <Routes>
          <Route path="/"          element={<GuestGuard><Landing /></GuestGuard>} />
          <Route path="/login"     element={<GuestGuard><Auth /></GuestGuard>} />
          <Route path="/register"  element={<GuestGuard><Auth /></GuestGuard>} />
          <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
          <Route path="/new-journey" element={<Guard><NewJourney /></Guard>} />
          <Route path="/journey/:id" element={<Guard><Workspace /></Guard>} />
          <Route path="/journey/:id/section/:sectionId" element={<Guard><SectionRoadmap /></Guard>} />
          <Route path="/journey/:id/chat" element={<Guard><JourneyChat /></Guard>} />
          <Route path="/journey/:id/team" element={<Guard><JourneyTeam /></Guard>} />
          <Route path="/calendar"  element={<Guard><Calendar /></Guard>} />
          <Route path="/settings"  element={<Guard><Settings /></Guard>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  )
}
