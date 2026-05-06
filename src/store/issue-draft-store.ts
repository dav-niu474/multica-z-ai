import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IssueStatus, IssuePriority, IssueAssigneeType } from '@/types'

// ==================== Issue Draft Store ====================
// Persists the issue creation draft across navigation / page refreshes

interface IssueDraft {
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assigneeType: IssueAssigneeType
  assigneeId: string | null
  projectId: string | null
  labelIds: string[]
}

interface IssueDraftState extends IssueDraft {
  // ---- Actions ----
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setStatus: (status: IssueStatus) => void
  setPriority: (priority: IssuePriority) => void
  setAssignee: (type: IssueAssigneeType, id: string | null) => void
  setProject: (id: string | null) => void
  addLabel: (id: string) => void
  removeLabel: (id: string) => void
  setLabelIds: (ids: string[]) => void
  reset: () => void
  updateDraft: (partial: Partial<IssueDraft>) => void
}

const defaultDraft: IssueDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'none',
  assigneeType: null,
  assigneeId: null,
  projectId: null,
  labelIds: [],
}

export const useIssueDraftStore = create<IssueDraftState>()(
  persist(
    (set) => ({
      ...defaultDraft,

      setTitle: (title) => set({ title }),

      setDescription: (description) => set({ description }),

      setStatus: (status) => set({ status }),

      setPriority: (priority) => set({ priority }),

      setAssignee: (type, id) => set({ assigneeType: type, assigneeId: id }),

      setProject: (id) => set({ projectId: id }),

      addLabel: (id) =>
        set((s) => ({
          labelIds: s.labelIds.includes(id) ? s.labelIds : [...s.labelIds, id],
        })),

      removeLabel: (id) =>
        set((s) => ({
          labelIds: s.labelIds.filter((lid) => lid !== id),
        })),

      setLabelIds: (ids) => set({ labelIds: ids }),

      reset: () => set({ ...defaultDraft }),

      updateDraft: (partial) => set(partial),
    }),
    {
      name: 'multica-issue-draft',
      partialize: (state) => ({
        title: state.title,
        description: state.description,
        status: state.status,
        priority: state.priority,
        assigneeType: state.assigneeType,
        assigneeId: state.assigneeId,
        projectId: state.projectId,
        labelIds: state.labelIds,
      }),
    },
  ),
)
