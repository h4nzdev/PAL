import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import logo from '../assets/logo.png'
import mascot from '../assets/mascot.png'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, register, signInWithGoogle } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(form.email, form.password, form.username)
      } else {
        await login(form.email, form.password)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Page will redirect to Google — no need to do anything else
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  const field = (type, key, placeholder) => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      required
      disabled={loading || googleLoading}
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none transition-all disabled:opacity-50"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
    />
  )

  const isDisabled = loading || googleLoading

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

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            {googleLoading ? (
              <Loader2 size={15} className="animate-spin text-gray-400" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-gray-700 text-xs">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Email form */}
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
              disabled={isDisabled}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isRegister ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
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
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
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
