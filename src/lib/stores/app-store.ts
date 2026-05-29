import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface AppState {
  theme: ThemeMode
  sidebarOpen: boolean
}

export interface AppActions {
  setTheme: (theme: ThemeMode) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export type AppStore = AppState & AppActions

/**
 * Global client-side app state.
 *
 * Notes:
 * - This is client-only state. Keep server state in TanStack Query.
 * - Persist is useful for preferences (theme/sidebar).
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        sidebarOpen: false,

        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }, false, 'setSidebarOpen'),
        toggleSidebar: () =>
          set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'toggleSidebar'),
      }),
      {
        name: 'app-store',
        partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }),
      },
    ),
    { name: 'app-store' },
  ),
)
