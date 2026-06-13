import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Layout/Sidebar'
import useAuthStore from '../store/useAuthStore'
import useToastStore from '../store/useToastStore'

export default function Settings() {
  const navigate = useNavigate()
  const { user, updateProfile, logout } = useAuthStore()
  const toast = useToastStore(s => s.toast)
  const [form, setForm] = useState({ username: user?.username || '', designation: user?.designation || '' })

  const handleSave = () => {
    updateProfile(form)
    toast('Profile updated successfully.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="flex min-h-screen text-white" style={{ background: '#030712' }}>
      <Sidebar />
      <main className="ml-52 flex-1 p-8 fade-up">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your profile and preferences.</p>

        <div className="max-w-lg space-y-5">
          {/* Profile card */}
          <div className="rounded-2xl p-6 border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {/* Avatar preview */}
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

          {/* Sign out */}
          <div className="rounded-2xl p-6 border border-red-500/15" style={{ background: 'rgba(239,68,68,0.03)' }}>
            <h2 className="text-red-400 font-semibold mb-1">Sign Out</h2>
            <p className="text-gray-500 text-sm mb-4">Your data is stored locally and will remain on this device.</p>
            <button
              onClick={handleLogout}
              className="text-red-400 border border-red-500/20 hover:bg-red-500/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.05)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
