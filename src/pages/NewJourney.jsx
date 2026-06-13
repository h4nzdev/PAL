import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderPlus } from 'lucide-react'
import useProjectStore from '../store/useProjectStore'
import useToastStore from '../store/useToastStore'
import logo from '../assets/logo.png'

export default function NewJourney() {
  const navigate = useNavigate()
  const createJourney = useProjectStore(s => s.createJourney)
  const toast = useToastStore(s => s.toast)
  const [name, setName] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    const id = createJourney(name.trim())
    toast(`Journey "${name.trim()}" created!`)
    navigate(`/journey/${id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#030712' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md fade-up">
        <div className="flex items-center justify-between mb-10">
          <img src={logo} alt="pal" className="h-6 w-auto" />
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={15} /> Dashboard
          </button>
        </div>

        <div className="rounded-2xl p-8 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-xl border border-emerald-500/20 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <FolderPlus size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">New Journey</h1>
              <p className="text-gray-500 text-xs mt-0.5">Give your project a name to get started</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs block mb-2">Journey Name</label>
              <input
                autoFocus
                placeholder="e.g. Snake Game, E-Comm Site, Portfolio..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              Create Journey →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
