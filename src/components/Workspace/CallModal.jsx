import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Users } from 'lucide-react'
import { toast } from 'sonner'

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function CallModal({ onClose, taskTitle, taskId }) {
  const [muted, setMuted]       = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [stream, setStream]     = useState(null)
  const [denied, setDenied]     = useState(false)
  const [duration, setDuration] = useState(0)
  const localVideoRef = useRef(null)
  const timerRef      = useRef(null)

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(s => {
        setStream(s)
        if (localVideoRef.current) localVideoRef.current.srcObject = s
      })
      .catch(() => setDenied(true))

    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [stream])

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') handleHangup() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [stream])

  const handleMute = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const handleCamera = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = cameraOff })
    setCameraOff(v => !v)
  }

  const handleHangup = () => {
    stream?.getTracks().forEach(t => t.stop())
    onClose()
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?task=${taskId}`
    navigator.clipboard?.writeText(link).catch(() => {})
    toast.success('Invite link copied to clipboard!')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="relative w-full flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: 780,
          height: '88vh',
          margin: '0 16px',
          background: '#080d17',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-gray-500 text-xs mb-0.5">Task Call</p>
            <h3 className="text-white font-semibold text-sm truncate">{taskTitle}</h3>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <span
              className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              {fmt(duration)}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Copy size={12} /> Invite
            </button>
            <button onClick={handleHangup} className="text-gray-500 hover:text-white transition-colors p-1">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 relative flex items-center justify-center" style={{ background: '#050a12' }}>
          {/* Remote placeholder */}
          <div className="flex flex-col items-center gap-5 text-center px-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center border-2 border-dashed"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <Users size={36} className="text-gray-700" />
            </div>
            <div>
              <p className="text-gray-300 font-semibold text-lg">Waiting for others to join…</p>
              <p className="text-gray-600 text-sm mt-1">Share the invite link to bring collaborators in</p>
            </div>
            <div
              className="flex items-center gap-2 text-xs text-amber-400 px-4 py-2 rounded-full"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              Peer connection requires signaling server · local preview active
            </div>
          </div>

          {/* Local video PiP */}
          <div
            className="absolute bottom-4 right-4 md:bottom-5 md:right-5 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 'min(196px, 40vw)',
              height: 'min(130px, 27vw)',
              background: '#0c1220',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {denied ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                <VideoOff size={18} className="text-gray-600" />
                <span className="text-gray-600 text-[10px] text-center px-2">Camera access denied</span>
              </div>
            ) : cameraOff ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#0a1020' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <VideoOff size={16} className="text-emerald-500" />
                </div>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
            <div
              className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
            >
              <span className="text-white text-[10px] font-medium">You</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex items-center justify-center gap-3 md:gap-4 py-4 md:py-5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
        >
          <button
            onClick={handleMute}
            title={muted ? 'Unmute' : 'Mute mic'}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {muted
              ? <MicOff size={18} className="text-red-400" />
              : <Mic size={18} className="text-white" />}
          </button>

          <button
            onClick={handleCamera}
            title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: cameraOff ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${cameraOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {cameraOff
              ? <VideoOff size={18} className="text-red-400" />
              : <Video size={18} className="text-white" />}
          </button>

          <button
            onClick={handleHangup}
            title="End call"
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 hover:brightness-110"
            style={{ background: '#ef4444', boxShadow: '0 0 24px rgba(239,68,68,0.35)' }}
          >
            <PhoneOff size={22} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
