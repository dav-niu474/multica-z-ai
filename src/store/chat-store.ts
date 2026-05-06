import { create } from 'zustand'

// ==================== Chat Store ====================
// Manages the chat panel's UI state (not data — data comes from API/TanStack Query)

interface ChatState {
  /** Whether the chat panel is open */
  isOpen: boolean
  /** Currently active chat session ID */
  activeSessionId: string | null
  /** Currently selected agent for new conversations */
  selectedAgentId: string | null
  /** Per-session input drafts, keyed by session ID */
  inputDrafts: Record<string, string>
  /** Whether the chat input is in focus mode (maximized) */
  focusMode: boolean
  /** Chat panel width in pixels */
  chatWidth: number
  /** Chat panel height in pixels */
  chatHeight: number
  /** Whether the chat panel is expanded (full width) */
  isExpanded: boolean

  // ---- Actions ----
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setActiveSession: (id: string | null) => void
  setSelectedAgent: (id: string | null) => void
  setInputDraft: (sessionId: string, draft: string) => void
  clearInputDraft: (sessionId: string) => void
  setFocusMode: (focus: boolean) => void
  toggleFocusMode: () => void
  setChatWidth: (width: number) => void
  setChatHeight: (height: number) => void
  setExpanded: (expanded: boolean) => void
  toggleExpanded: () => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  activeSessionId: null,
  selectedAgentId: null,
  inputDrafts: {} as Record<string, string>,
  focusMode: false,
  chatWidth: 420,
  chatHeight: 600,
  isExpanded: false,
}

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setActiveSession: (id) => set({ activeSessionId: id }),
  setSelectedAgent: (id) => set({ selectedAgentId: id }),

  setInputDraft: (sessionId, draft) =>
    set((s) => ({
      inputDrafts: { ...s.inputDrafts, [sessionId]: draft },
    })),

  clearInputDraft: (sessionId) =>
    set((s) => {
      const next = { ...s.inputDrafts }
      delete next[sessionId]
      return { inputDrafts: next }
    }),

  setFocusMode: (focus) => set({ focusMode: focus }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setChatWidth: (width) => set({ chatWidth: width }),
  setChatHeight: (height) => set({ chatHeight: height }),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),

  reset: () => set(initialState),
}))
