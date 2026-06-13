import { create } from 'zustand'

const useToastStore = create((set) => ({
  toasts: [],
  toast(message, type = 'success') {
    const id = crypto.randomUUID()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  dismiss(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

export default useToastStore
