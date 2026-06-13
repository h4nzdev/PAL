import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, Sun, Moon } from 'lucide-react'
import Sidebar from '../components/Layout/Sidebar'
import useAuthStore from '../store/useAuthStore'
import useThemeStore from '../store/useThemeStore'
import { toast } from 'sonner'

export default function Settings() {
  const navigate = useNavigate()
  const { user, updateProfile, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [form, setForm] = useState({ username: user?.username || '', designation: user?.designation || '' })

  // Groq API key (stored in localStorage only — never sent to server)
  const [groqKey,     setGroqKey]     = useState(() => localStorage.getItem('pal-groq-key') || '')
  const [showGroqKey, setShowGroqKey] = useState(false)
  const savedKey = localStorage.getItem('pal-groq-key') || ''

  const handleSave = () => {
    updateProfile(form)
    toast.success('Profile updated successfully.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const saveGroqKey = () => {
    const trimmed = groqKey.trim()
    if (!trimmed) { toast.error('Enter a valid key before saving.'); return }
    if (!trimmed.startsWith('gsk_')) { toast.error('Groq API keys start with gsk_'); return }
    localStorage.setItem('pal-groq-key', trimmed)
    toast.success('Groq API key saved.')
  }

  const clearGroqKey = () => {
    localStorage.removeItem('pal-groq-key')
    setGroqKey('')
    toast('Groq API key removed.')
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="md:ml-52 flex-1 overflow-y-auto fade-up">
      <div className="max-w-2xl mx-auto px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your profile and preferences.</p>

        <div className="space-y-5">

          {/* Profile card */}
          <div className="rounded-2xl p-6 border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-xl font-bold">
                  {form.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{form.username || 'Your Name'}</p>
                <p className="text-gray-500 text-xs">{form.designation || 'No designation set'}</p>
                <p className="text-gray-600 text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>

            <h2 className="text-white font-semibold">Profile</h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-xs block mb-1.5">Username</label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1.5">Email</label>
                <input
                  value={user?.email || ''}
                  disabled
                  className={inputClass + ' cursor-not-allowed'}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1.5">Designation</label>
                <input
                  placeholder="e.g. Full Stack Developer"
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  className={inputClass + ' placeholder:text-gray-700'}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              Save Changes
            </button>
          </div>

          {/* AI Settings — Groq API key */}
          <div className="rounded-2xl p-6 border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <h2 className="text-white font-semibold">AI Settings</h2>
              <p className="text-gray-500 text-xs mt-0.5">Use your own Groq API key for unlimited AI co-pilot access.</p>
            </div>

            {savedKey && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-300">Custom key active — using your Groq quota</span>
              </div>
            )}

            <div>
              <label className="text-gray-500 text-xs block mb-1.5">Groq API Key</label>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={e => setGroqKey(e.target.value)}
                  className={inputClass + ' font-mono pr-10'}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showGroqKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-gray-700 text-xs mt-1.5">
                Get your key at <span className="text-gray-500">console.groq.com</span> · Stored in browser only, never uploaded.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={saveGroqKey}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Save Key
              </button>
              {savedKey && (
                <button
                  onClick={clearGroqKey}
                  className="text-gray-500 hover:text-red-400 px-4 py-2 rounded-xl text-sm transition-all border border-white/8 hover:border-red-500/20"
                >
                  Remove Key
                </button>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div className="rounded-2xl p-6 border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <h2 className="text-white font-semibold">Appearance</h2>
              <p className="text-gray-500 text-xs mt-0.5">Choose your preferred color theme.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  theme === 'dark'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'border-white/8 text-gray-400 hover:border-white/15 hover:text-gray-300'
                }`}
              >
                <Moon size={15} /> Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  theme === 'light'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'border-white/8 text-gray-400 hover:border-white/15 hover:text-gray-300'
                }`}
              >
                <Sun size={15} /> Light
              </button>
            </div>
          </div>

          {/* Sign out */}
          <div className="rounded-2xl p-6 border border-red-500/15" style={{ background: 'rgba(239,68,68,0.03)' }}>
            <h2 className="text-red-400 font-semibold mb-1">Sign Out</h2>
            <p className="text-gray-500 text-sm mb-4">You'll be redirected to the login page.</p>
            <button
              onClick={handleLogout}
              className="text-red-400 border border-red-500/20 hover:bg-red-500/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.05)' }}
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
      </main>
    </div>
  )
}
