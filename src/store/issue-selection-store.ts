import { create } from 'zustand'

// ==================== Issue Selection Store ====================
// Multi-selection state for issues (used for batch operations)

interface IssueSelectionState {
  /** Set of selected issue IDs */
  selectedIds: Set<string>
  /** Toggle selection of a single issue */
  toggle: (id: string) => void
  /** Add an issue to selection */
  add: (id: string) => void
  /** Remove an issue from selection */
  remove: (id: string) => void
  /** Clear all selections */
  clear: () => void
  /** Select all from a given list of IDs */
  selectAll: (ids: string[]) => void
  /** Check if a specific issue is selected */
  isSelected: (id: string) => boolean
  /** Get the count of selected issues */
  count: () => number
}

export const useIssueSelectionStore = create<IssueSelectionState>((set, get) => ({
  selectedIds: new Set<string>(),

  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedIds: next }
    }),

  add: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.add(id)
      return { selectedIds: next }
    }),

  remove: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.delete(id)
      return { selectedIds: next }
    }),

  clear: () => set({ selectedIds: new Set<string>() }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  isSelected: (id) => get().selectedIds.has(id),

  count: () => get().selectedIds.size,
}))
