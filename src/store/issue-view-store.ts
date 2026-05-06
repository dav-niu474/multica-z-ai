import { create } from 'zustand'
import type { IssueStatus, IssuePriority, IssueAssigneeType } from '@/types'

// ==================== Issue View Store ====================
// Persists user preferences for the issue board/list view

type ViewMode = 'board' | 'list'
type SortField = 'position' | 'priority' | 'status' | 'createdAt' | 'updatedAt' | 'dueDate'
type SortOrder = 'asc' | 'desc'

interface IssueFilters {
  status: IssueStatus | null
  priority: IssuePriority | null
  assigneeType: IssueAssigneeType | null
  assigneeId: string | null
  projectId: string | null
  search: string
}

interface IssueViewState {
  viewMode: ViewMode
  sortField: SortField
  sortOrder: SortOrder
  filters: IssueFilters
  columnWidths: Record<string, number>

  // ---- Actions ----
  setViewMode: (mode: ViewMode) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setFilter: <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => void
  clearFilters: () => void
  setColumnWidth: (column: string, width: number) => void
}

const defaultFilters: IssueFilters = {
  status: null,
  priority: null,
  assigneeType: null,
  assigneeId: null,
  projectId: null,
  search: '',
}

export const useIssueViewStore = create<IssueViewState>((set) => ({
  viewMode: 'board',
  sortField: 'position',
  sortOrder: 'asc',
  filters: { ...defaultFilters },
  columnWidths: {},

  setViewMode: (mode) => set({ viewMode: mode }),

  setSortField: (field) =>
    set((s) => ({
      sortField: field,
      // Reset to asc when changing field
      sortOrder: s.sortField === field ? s.sortOrder : 'asc',
    })),

  setSortOrder: (order) => set({ sortOrder: order }),

  setFilter: (key, value) =>
    set((s) => ({
      filters: { ...s.filters, [key]: value },
    })),

  clearFilters: () => set({ filters: { ...defaultFilters } }),

  setColumnWidth: (column, width) =>
    set((s) => ({
      columnWidths: { ...s.columnWidths, [column]: width },
    })),
}))
