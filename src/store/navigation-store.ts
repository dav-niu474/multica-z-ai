import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ViewType } from '@/types'

// ==================== Navigation Store ====================
// Persists the user's last view and workspace across sessions

interface NavigationState {
  lastView: ViewType
  lastWorkspaceId: string
  setLastView: (view: ViewType) => void
  setLastWorkspace: (id: string) => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      lastView: 'dashboard' as ViewType,
      lastWorkspaceId: '',

      setLastView: (view) => set({ lastView: view }),
      setLastWorkspace: (id) => set({ lastWorkspaceId: id }),
    }),
    {
      name: 'multica-navigation',
      partialize: (state) => ({
        lastView: state.lastView,
        lastWorkspaceId: state.lastWorkspaceId,
      }),
    },
  ),
)
