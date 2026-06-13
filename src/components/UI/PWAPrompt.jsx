import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, WifiOff, X } from 'lucide-react'

export default function PWAPrompt() {
  const {
    offlineReady:  [offlineReady,  setOfflineReady],
    needRefresh:   [needRefresh,   setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every hour
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      className="fixed bottom-4 left-4 z-[70] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 320 }}
    >
      {needRefresh ? (
        <>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)' }}
          >
            <RefreshCw size={14} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">Update available</p>
            <p className="text-gray-500 text-xs mt-0.5">Reload to get the latest version.</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
              style={{ background: '#10b981', color: 'white' }}
            >
              Reload
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="p-1.5 text-gray-600 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.12)' }}
          >
            <WifiOff size={14} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">Ready to work offline</p>
            <p className="text-gray-500 text-xs mt-0.5">JourneyPad is installed and cached.</p>
          </div>
          <button
            onClick={() => setOfflineReady(false)}
            className="p-1.5 text-gray-600 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={13} />
          </button>
        </>
      )}
    </div>
  )
}
