import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import hero from '../assets/hero.png'
import mascot from '../assets/mascot.png'

const features = [
  {
    icon: '🗺️',
    title: 'Section Roadmaps',
    desc: 'Break every project into phases. Each section becomes a numbered milestone roadmap your whole team can follow.',
    accent: '#10b981',
  },
  {
    icon: '🤖',
    title: 'AI Co-Pilot',
    desc: 'Context-aware AI that reads your full project tree — generate tasks, write plans, or break ideas down in seconds.',
    accent: '#6366f1',
  },
  {
    icon: '💬',
    title: 'Team Chat',
    desc: 'A real-time group chat lives inside every journey. Discuss, share updates, and keep context where the work is.',
    accent: '#f59e0b',
  },
  {
    icon: '📊',
    title: 'Live Progress',
    desc: 'Completion percentages roll up from tasks to sections to journeys. Always know where you stand.',
    accent: '#10b981',
  },
  {
    icon: '🔗',
    title: 'Invite Anyone',
    desc: 'Share a single link to give teammates instant access to your journey — no email confirmations, no friction.',
    accent: '#ec4899',
  },
  {
    icon: '📱',
    title: 'Works Everywhere',
    desc: 'Responsive mobile UI with a bottom nav. Installable as a PWA. Works offline with full local caching.',
    accent: '#14b8a6',
  },
]

const steps = [
  {
    num: '01',
    title: 'Create a Journey',
    desc: 'Give your project a name. JourneyPad instantly creates your workspace with an AI co-pilot standing by.',
  },
  {
    num: '02',
    title: 'Build your roadmap',
    desc: 'Add sections for each phase, drop in tasks, assign owners, and set due dates — all in one nested document.',
  },
  {
    num: '03',
    title: 'Ship with your team',
    desc: 'Invite collaborators via link, chat in real-time, and watch progress track itself as tasks get checked off.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#030712' }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-16 py-4" style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <img src={logo} alt="JourneyPad" className="h-7 w-auto" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-px transform"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-6 lg:px-16 pt-24 pb-20">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full blur-[140px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />
          <div className="absolute top-32 right-0 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Beta badge */}
          <div className="flex justify-center mb-8 fade-up">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              Now in beta · Completely free
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-8 fade-up" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6">
              Your projects,{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-emerald-400">finally</span>
                <span className="absolute -bottom-1 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)' }} />
              </span>{' '}
              organized.
            </h1>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              JourneyPad is a collaborative workspace that turns messy project plans into clean visual roadmaps — with an AI co-pilot and real-time team chat built right in.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-14 fade-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => navigate('/register')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform"
            >
              Start for free →
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-gray-300 hover:text-white px-8 py-3.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Sign in
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-8 md:gap-14 mb-16 fade-up" style={{ animationDelay: '0.15s' }}>
            {[['∞', 'Journeys'], ['AI', 'Co-Pilot built in'], ['🔗', 'Shareable links'], ['100%', 'Free forever']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-emerald-400 font-bold text-xl md:text-2xl leading-none mb-1">{val}</p>
                <p className="text-gray-600 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Hero image */}
          <div className="relative fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-6 rounded-3xl blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>
              {/* Fake browser chrome */}
              <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(10,15,28,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/50" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-xs mx-auto rounded-md px-3 py-1 text-xs text-gray-600 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    pal-ai-cham.vercel.app
                  </div>
                </div>
                <div className="w-14" />
              </div>
              <img src={hero} alt="JourneyPad workspace preview" className="w-full block" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 lg:px-16 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold">From idea to shipped in three steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.25), transparent)' }} />
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 font-bold text-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399' }}>
                  {s.num}
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your team needs</h2>
          <p className="text-gray-500 max-w-xl mx-auto">From planning to shipping, JourneyPad keeps your whole project in one place — tasks, chat, AI, and progress all unified.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {features.map(f => (
            <div
              key={f.title}
              className="rounded-2xl p-7 transition-all group cursor-default hover:-translate-y-0.5 transform"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.accent}25` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <span className="text-3xl mb-5 block">{f.icon}</span>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI highlight band ── */}
      <section className="px-6 lg:px-16 py-20" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.04) 100%)', borderTop: '1px solid rgba(16,185,129,0.1)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-4">AI-Powered</p>
            <h2 className="text-3xl font-bold mb-5 leading-tight">
              An AI that actually knows your project
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              The AI co-pilot reads your entire task tree in real time. Ask it to break down a section, write a plan, or generate prompts — it already has context, so you don't have to explain anything.
            </p>
            <ul className="space-y-3">
              {['Context-aware AI co-pilot in every workspace', 'Per-task AI assistant with project baseline', 'Pal — your friendly AI mascot on the dashboard', 'Upload CLAUDE.md or any project doc as context'].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)', fontSize: 10 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            {/* Mock chat bubbles */}
            {[
              { role: 'user', text: 'Break down the onboarding flow into tasks' },
              { role: 'ai', text: "Sure! Here's a breakdown:\n\n**1. Welcome screen** — show app value\n**2. Account setup** — name, email, password\n**3. First journey** — guided creation flow\n**4. Sample tasks** — pre-populate to show the UI" },
            ].map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}>
                {m.role === 'ai' && (
                  <img src={mascot} alt="" className="w-7 h-7 object-contain flex-shrink-0 self-start mt-1" />
                )}
                <div
                  className="rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%]"
                  style={{
                    background: m.role === 'user' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    color: m.role === 'user' ? '#a7f3d0' : '#e2e8f0',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA with mascot ── */}
      <section className="px-6 lg:px-16 py-28 text-center">
        <div className="max-w-lg mx-auto">
          <img src={mascot} alt="Pal" className="mascot-float w-24 h-24 object-contain mx-auto mb-8 drop-shadow-2xl select-none" />
          <h2 className="text-4xl font-bold mb-4 leading-tight">Ready to ship something great?</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Create your free account and map your first journey in under a minute. No credit card, no setup — just start building.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-12 py-4 rounded-xl text-sm font-semibold transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/45 hover:-translate-y-0.5 transform"
          >
            Get started — it's free
          </button>
          <p className="text-gray-700 text-xs mt-5">No credit card required · Free forever</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 lg:px-16 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="JourneyPad" className="h-5 w-auto opacity-40" />
          <p className="text-gray-700 text-xs text-center">
            Built with React 19, Supabase, Groq AI · Deployed on Vercel
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-gray-700 hover:text-gray-400 text-xs transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="text-gray-700 hover:text-gray-400 text-xs transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
