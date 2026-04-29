import { create } from 'zustand';
import type { ViewType } from '@/types';

interface AppState {
  // View state
  currentView: ViewType;
  sidebarOpen: boolean;

  // Selection state
  selectedAgentId: string | null;
  selectedIssueId: string | null;
  selectedChatId: string | null;

  // Workspace
  workspaceId: string;
  workspaceName: string;

  // Actions
  setView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectAgent: (id: string | null) => void;
  selectIssue: (id: string | null) => void;
  selectChat: (id: string | null) => void;
  setWorkspace: (id: string, name: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Default state
  currentView: 'dashboard',
  sidebarOpen: false,
  selectedAgentId: null,
  selectedIssueId: null,
  selectedChatId: null,
  workspaceId: '',
  workspaceName: 'AgentHub',

  // Actions
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectAgent: (id) => set({ selectedAgentId: id }),
  selectIssue: (id) => set({ selectedIssueId: id }),
  selectChat: (id) => set({ selectedChatId: id }),
  setWorkspace: (id, name) => set({ workspaceId: id, workspaceName: name }),
}));
