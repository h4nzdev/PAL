import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import useToastStore from '../../store/useToastStore'

const CONFIG = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bar: 'bg-emerald-500' },
  error:   { icon: AlertCircle,   color: 'text-red-400',     bar: 'bg-red-500'     },
  info:    { icon: Info,          color: 'text-blue-400',    bar: 'bg-blue-500'    },
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const { icon: Icon, color, bar } = CONFIG[t.type] || CONFIG.success
        return (
          <div
            key={t.id}
            className="toast-enter flex items-center gap-3 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl pointer-events-auto min-w-[280px] max-w-sm relative overflow-hidden"
          >
            <div className={`absolute bottom-0 left-0 h-0.5 w-full ${bar} opacity-50`} />
            <Icon size={16} className={`${color} flex-shrink-0`} />
            <p className="text-white text-sm flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-1"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
