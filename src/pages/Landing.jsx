import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import hero from '../assets/hero.png'
import mascot from '../assets/mascot.png'

const features = [
  { icon: '🗺️', title: 'Section Roadmaps', desc: 'Break every project into phases. Each section becomes a numbered milestone roadmap.' },
  { icon: '🤖', title: 'AI Co-Pilot', desc: 'Context-aware AI that reads your full project tree and helps you plan, generate, or break down tasks.' },
  { icon: '📊', title: 'Live Progress', desc: 'Real-time completion tracking across all journeys, sections, and tasks in one dashboard.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 lg:px-16 py-5 border-b border-white/5">
        <img src={logo} alt="pal" className="h-7 w-auto" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 lg:px-16 pt-20 pb-16">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-dot" />
              <span className="text-emerald-400 text-xs font-medium">Now in beta · Free to use</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              Plan smarter.<br />
              <span className="text-emerald-400">Ship faster.</span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
              A collaborative workspace that turns chaotic project plans into clean visual roadmaps — with an AI co-pilot built in.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-7 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform"
              >
                Start for free →
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-7 py-3.5 rounded-xl text-sm font-medium transition-all"
              >
                Sign in
              </button>
            </div>

            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-white/5">
              {[['∞', 'Journeys'], ['AI', 'Co-Pilot'], ['100%', 'Free']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-emerald-400 font-bold text-lg">{val}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product screenshot */}
          <div className="relative fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="absolute -inset-4 rounded-3xl blur-2xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="h-7 bg-gray-900 flex items-center px-4 gap-1.5 border-b border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <img src={hero} alt="pal workspace preview" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 lg:px-16 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything your project needs</h2>
          <p className="text-gray-500">From planning to shipping, pal keeps the whole team in sync.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 stagger">
          {features.map(f => (
            <div
              key={f.title}
              className="bg-white/3 border border-white/8 rounded-2xl p-7 hover:border-emerald-500/25 hover:bg-white/5 transition-all group cursor-default"
            >
              <span className="text-4xl mb-5 block">{f.icon}</span>
              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA with mascot */}
      <section className="px-8 lg:px-16 py-24 text-center">
        <div className="max-w-md mx-auto">
          <img src={mascot} alt="" className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-xl" />
          <h2 className="text-3xl font-bold mb-3">Ready to ship something great?</h2>
          <p className="text-gray-500 mb-8">Create your free account and start mapping your first journey in seconds.</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-xl text-sm font-semibold transition-all shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5 transform"
          >
            Get started — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <img src={logo} alt="pal" className="h-5 w-auto opacity-50" />
        <p className="text-gray-600 text-xs">Built with ❤️ · localStorage-powered MVP</p>
      </footer>
    </div>
  )
}
