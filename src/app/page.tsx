'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard,
  Bot,
  Kanban,
  MessageSquare,
  Zap,
  FolderKanban,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers,
} from 'lucide-react'
import DashboardView from '@/components/views/dashboard-view'
import AgentsView from '@/components/views/agents-view'
import IssuesView from '@/components/views/issues-view'
import ChatView from '@/components/views/chat-view'
import { SkillsView } from '@/components/views/skills-view'
import { ProjectsView } from '@/components/views/projects-view'
import { PatternsView } from '@/components/views/patterns-view'
import type { Workspace } from '@/types'

type ViewKey = 'dashboard' | 'agents' | 'issues' | 'chat' | 'skills' | 'projects' | 'patterns'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'agents', label: 'Agents', icon: <Bot className="h-4 w-4" /> },
  { key: 'issues', label: 'Issues', icon: <Kanban className="h-4 w-4" /> },
  { key: 'skills', label: 'Skills', icon: <Zap className="h-4 w-4" /> },
  { key: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
  { key: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'patterns', label: 'Patterns', icon: <BookOpen className="h-4 w-4" /> },
]

export default function Home() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [activeView, setActiveView] = useState<ViewKey>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Setup database tables + seed demo data, then load workspace
    fetch('/api/setup', { method: 'POST' })
      .catch(() => {}) // Ignore if already set up
      .finally(() => {
        fetch('/api/workspaces')
          .then((r) => r.json())
          .then((data: Workspace[]) => {
            if (data.length > 0) {
              setWorkspace(data[0])
              setWorkspaceId(data[0].id)
            }
          })
          .catch(console.error)
          .finally(() => setLoading(false))
      })
  }, [])

  const renderView = useCallback(() => {
    if (!workspaceId) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">No workspace found.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'agents':
        return <AgentsView />
      case 'issues':
        return <IssuesView workspaceId={workspaceId} />
      case 'skills':
        return <SkillsView workspaceId={workspaceId} />
      case 'projects':
        return <ProjectsView workspaceId={workspaceId} />
      case 'chat':
        return <ChatView workspaceId={workspaceId} />
      case 'patterns':
        return <PatternsView />
      default:
        return null
    }
  }, [activeView, workspaceId])

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-14 border-r flex flex-col items-center py-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-md" />
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside
        className={`hidden lg:flex ${
          sidebarCollapsed ? 'w-14' : 'w-[220px]'
        } border-r bg-card flex-col shrink-0 transition-all duration-200`}
      >
        {/* Workspace header */}
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {workspace?.name || 'AgentHub'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {workspace?.slug || ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.key
            return (
              <Button
                key={item.key}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full ${
                  sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
                } h-9 text-sm gap-2`}
                onClick={() => setActiveView(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t space-y-0.5">
          <Button
            variant="ghost"
            className={`w-full ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
            } h-9 text-sm gap-2 text-muted-foreground`}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings className="h-4 w-4" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            className={`w-full ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
            } h-9 text-sm`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r flex-col shrink-0 transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {workspace?.name || 'AgentHub'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.key
            return (
              <Button
                key={item.key}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start h-9 text-sm gap-2"
                onClick={() => {
                  setActiveView(item.key)
                  setMobileMenuOpen(false)
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileMenuOpen(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">
              {workspace?.name || 'AgentHub'}
            </span>
          </div>
        </div>

        {/* View content */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
