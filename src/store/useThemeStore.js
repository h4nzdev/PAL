import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme(theme) {
        set({ theme })
        document.documentElement.classList.toggle('light', theme === 'light')
      },
    }),
    {
      name: 'pal-theme',
      // Apply the class as soon as the persisted state is loaded (no flash)
      onRehydrateStorage: () => (state) => {
        document.documentElement.classList.toggle('light', state?.theme === 'light')
      },
    }
  )
)

export default useThemeStore
