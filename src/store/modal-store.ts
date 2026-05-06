import { create } from 'zustand'

// ==================== Modal Store ====================

export type ModalType =
  | 'create-workspace'
  | 'create-issue'
  | 'quick-create-issue'
  | 'create-project'
  | 'create-agent'
  | 'feedback'
  | 'delete-confirm'
  | 'invite-member'
  | null

interface ModalStore {
  modal: ModalType
  data: Record<string, unknown> | null
  open: (modal: ModalType, data?: Record<string, unknown>) => void
  close: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  modal: null,
  data: null,

  open: (modal, data = null) => set({ modal, data }),

  close: () => set({ modal: null, data: null }),
}))
