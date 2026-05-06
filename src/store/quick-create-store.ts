import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== Quick Create Store ====================
// Persists the quick agent creation panel state

interface QuickCreateState {
  /** The last created or selected agent ID */
  lastAgentId: string | null
  /** The prompt/content for quick creation */
  prompt: string
  /** Whether to keep the panel open after creating an agent */
  keepOpen: boolean

  // ---- Actions ----
  setLastAgentId: (id: string | null) => void
  setPrompt: (prompt: string) => void
  setKeepOpen: (keepOpen: boolean) => void
  toggleKeepOpen: () => void
  reset: () => void
}

const defaultState = {
  lastAgentId: null,
  prompt: '',
  keepOpen: false,
}

export const useQuickCreateStore = create<QuickCreateState>()(
  persist(
    (set) => ({
      ...defaultState,

      setLastAgentId: (id) => set({ lastAgentId: id }),

      setPrompt: (prompt) => set({ prompt }),

      setKeepOpen: (keepOpen) => set({ keepOpen }),

      toggleKeepOpen: () => set((s) => ({ keepOpen: !s.keepOpen })),

      reset: () => set({ ...defaultState }),
    }),
    {
      name: 'multica-quick-create',
      partialize: (state) => ({
        lastAgentId: state.lastAgentId,
        prompt: state.prompt,
        keepOpen: state.keepOpen,
      }),
    },
  ),
)
