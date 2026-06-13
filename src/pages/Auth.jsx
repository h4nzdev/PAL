import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import logo from '../assets/logo.png'
import mascot from '../assets/mascot.png'

export default function Auth() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) register(form.email, form.password, form.username)
      else login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const field = (type, key, placeholder) => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      required
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
    />
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left: Form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 relative max-w-xl">
        <div className="absolute top-6 left-8">
          <img src={logo} alt="pal" className="h-7 w-auto cursor-pointer" onClick={() => navigate('/')} />
        </div>

        <div className="fade-up">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isRegister ? 'Start mapping your first journey today.' : 'Sign in to continue to your workspace.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && field('text', 'username', 'Username')}
            {field('email', 'email', 'Email address')}
            {field('password', 'password', 'Password')}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 mt-2"
            >
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => navigate(isRegister ? '/login' : '/register')}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isRegister ? 'Sign in' : 'Create one free'}
            </button>
          </p>
        </div>
      </div>

      {/* Right: Visual panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1f14 0%, #030712 60%, #050e1a 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 65%)' }} />

        <div className="relative z-10 text-center px-12">
          <img src={mascot} alt="" className="w-28 h-28 object-contain mx-auto mb-8 drop-shadow-2xl" />
          <h2 className="text-2xl font-bold text-white mb-3">Your projects,<br />beautifully mapped.</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Turn messy project plans into clean, visual roadmaps with AI-powered co-pilot assistance.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10">
            {[['Roadmaps', '🗺️'], ['AI Chat', '🤖'], ['Progress', '📊']].map(([label, icon]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-xl block mb-1">{icon}</span>
                <span className="text-gray-400 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
