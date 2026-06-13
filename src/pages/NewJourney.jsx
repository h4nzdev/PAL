import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderPlus, Copy, Check, ArrowRight, Users } from 'lucide-react'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from "../store/useAuthStore";
import { toast } from 'sonner'
import logo from '../assets/logo.png'

const BASE_URL = 'https://pal-ai-cham.vercel.app'

export default function NewJourney() {
  const navigate = useNavigate()
  const createJourney = useProjectStore(s => s.createJourney)
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null) // { id, name }
  const [copied, setCopied] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    if (!user?.id) {
      toast.error("You must be logged in to create a journey.");
      return;
    }
    const id = createJourney(name.trim(), user.id);
    setCreated({ id, name: name.trim() })
  }

  const inviteLink = created ? `${BASE_URL}/journey/${created.id}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
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

        {!created ? (
          /* ── Create form ── */
          <div className="rounded-2xl p-8 border" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-md)' }}>
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
        ) : (
          /* ── Success + invite link ── */
          <div className="rounded-2xl p-8 border" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: 'rgba(16,185,129,0.2)' }}>
            {/* Checkmark header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Check size={26} className="text-emerald-400" strokeWidth={2.5} />
              </div>
              <h1 className="text-white font-bold text-xl mb-1">Journey Created!</h1>
              <p className="text-gray-500 text-sm">
                <span className="text-emerald-400 font-medium">{created.name}</span> is ready to go.
              </p>
            </div>

            {/* Invite link section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-400" />
                <p className="text-gray-400 text-xs font-medium">Invite link — share with your team</p>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="flex-1 text-gray-400 text-xs truncate font-mono select-all">{inviteLink}</p>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                  style={copied
                    ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-700 text-xs mt-2 text-center">Anyone with this link can join your journey</p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => navigate(`/journey/${created.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
              >
                Open Journey <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-gray-500 hover:text-gray-300 py-2.5 rounded-xl text-sm transition-colors text-center"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
