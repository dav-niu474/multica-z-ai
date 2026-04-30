'use client'

import React, { useState, useEffect, useCallback, Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
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
  LogIn,
  LogOut,
} from 'lucide-react'
import { ConnectionIndicator } from '@/components/realtime/connection-indicator'
import { I18nProvider, useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-session'
import type { Workspace, ViewType } from '@/types'

// ==================== Code-split heavy view components ====================
// This reduces the initial JS bundle from ~1.5MB to ~100KB

const DashboardView = dynamic(() => import('@/components/views/dashboard-view').then(m => ({ default: m.default })), {
  loading: () => <ViewSkeleton />,
})
const AgentsView = dynamic(() => import('@/components/views/agents-view').then(m => ({ default: m.default })), {
  loading: () => <ViewSkeleton />,
})
const IssuesView = dynamic(() => import('@/components/views/issues-view').then(m => ({ default: m.default })), {
  loading: () => <ViewSkeleton />,
})
const ChatView = dynamic(() => import('@/components/views/chat-view').then(m => ({ default: m.default })), {
  loading: () => <ViewSkeleton />,
})
const SkillsView = dynamic(() => import('@/components/views/skills-view').then(m => ({ default: m.SkillsView })), {
  loading: () => <ViewSkeleton />,
})
const ProjectsView = dynamic(() => import('@/components/views/projects-view').then(m => ({ default: m.ProjectsView })), {
  loading: () => <ViewSkeleton />,
})
const PatternsView = dynamic(() => import('@/components/views/patterns-view').then(m => ({ default: m.PatternsView })), {
  loading: () => <ViewSkeleton />,
})
const SettingsView = dynamic(() => import('@/components/views/settings-view').then(m => ({ default: m.SettingsView })), {
  loading: () => <ViewSkeleton />,
})

const RealtimeSetup = dynamic(
  () => import('@/components/realtime/realtime-provider').then(m => ({ default: m.RealtimeSetup })),
  { ssr: false }
)

// ==================== Skeleton for lazy-loaded views ====================

function ViewSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

// ==================== Navigation Items ====================

const NAV_ICONS: Record<Exclude<ViewType, 'settings'>, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  agents: <Bot className="h-4 w-4" />,
  issues: <Kanban className="h-4 w-4" />,
  skills: <Zap className="h-4 w-4" />,
  projects: <FolderKanban className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  patterns: <BookOpen className="h-4 w-4" />,
}

const NAV_KEYS: Exclude<ViewType, 'settings'>[] = [
  'dashboard',
  'agents',
  'issues',
  'skills',
  'projects',
  'chat',
  'patterns',
]

const getNavLabel = (key: Exclude<ViewType, 'settings'>, t: any): string => {
  switch (key) {
    case 'dashboard': return t.nav.dashboard
    case 'agents': return t.nav.agents
    case 'issues': return t.nav.issues
    case 'skills': return t.nav.skills
    case 'projects': return t.nav.projects
    case 'chat': return t.nav.chat
    case 'patterns': return t.nav.patterns
    default: return key
  }
}

// ==================== Auth Guard ====================

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authenticated, loading } = useAuth()

  // During auth check, show a brief spinner (client-side only)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  // Not authenticated → show sign-in prompt
  if (!authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">AgentHub</h1>
            <p className="text-muted-foreground">Sign in to continue to your workspace</p>
          </div>
          <Button
            className="h-11 gap-2 px-8"
            onClick={() => window.location.href = '/login'}
          >
            <LogIn className="h-4 w-4" />
            Sign in to continue
          </Button>
          <p className="text-xs text-muted-foreground">
            Multi-Agent Team Collaboration Platform
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// ==================== Main App Content ====================

function AppContent() {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // Step 1: Setup database (idempotent)
        const setupRes = await fetch('/api/setup', { method: 'POST' })
        if (!setupRes.ok) {
          const errData = await setupRes.json().catch(() => ({}))
          console.error('Setup failed:', errData)
          setSetupError('Database setup failed. Please try again.')
          setLoading(false)
          return
        }

        // Step 2: Fetch workspaces
        const wsRes = await fetch('/api/workspaces')
        if (!wsRes.ok) {
          console.error('Failed to fetch workspaces:', wsRes.status)
          setSetupError('Failed to load workspace data.')
          setLoading(false)
          return
        }

        const data: Workspace[] = await wsRes.json()
        if (data.length > 0) {
          setWorkspace(data[0])
          setWorkspaceId(data[0].id)
        }
      } catch (err) {
        console.error('Init error:', err)
        setSetupError('Network error. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleRetry = useCallback(async () => {
    setSetupError(null)
    setLoading(true)
    try {
      const setupRes = await fetch('/api/setup', { method: 'POST' })
      if (!setupRes.ok) {
        setSetupError('Database setup failed. Please try again.')
        setLoading(false)
        return
      }
      const wsRes = await fetch('/api/workspaces')
      if (wsRes.ok) {
        const data: Workspace[] = await wsRes.json()
        if (data.length > 0) {
          setWorkspace(data[0])
          setWorkspaceId(data[0].id)
        }
        setSetupError(null)
      }
    } catch (err) {
      console.error('Retry error:', err)
      setSetupError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleNav = useCallback((view: ViewType) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }, [])

  const renderView = useCallback(() => {
    if (setupError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <Layers className="h-12 w-12 text-destructive/20 mx-auto" />
            <p className="text-sm text-destructive">{setupError}</p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              {t.common.retry}
            </Button>
          </div>
        </div>
      )
    }

    if (!workspaceId && activeView !== 'settings') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">{t.workspace.noWorkspaceFound}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
            >
              {t.common.retry}
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
      case 'settings':
        return <SettingsView />
      default:
        return null
    }
  }, [activeView, workspaceId, t, setupError, handleRetry])

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
            <p className="text-sm text-muted-foreground">{t.workspace.loadingWorkspace}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RealtimeSetup workspaceId={workspaceId}>
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
            {NAV_KEYS.map((key) => {
              const isActive = activeView === key
              const label = getNavLabel(key, t)
              return (
                <Button
                  key={key}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full ${
                    sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
                  } h-9 text-sm gap-2`}
                  onClick={() => handleNav(key)}
                  title={sidebarCollapsed ? label : undefined}
                >
                  {NAV_ICONS[key]}
                  {!sidebarCollapsed && <span>{label}</span>}
                </Button>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-2 border-t space-y-0.5">
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              className={`w-full ${
                sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
              } h-9 text-sm gap-2 text-muted-foreground`}
              onClick={() => handleNav('settings')}
              title={sidebarCollapsed ? t.nav.settings : undefined}
            >
              <Settings className="h-4 w-4" />
              {!sidebarCollapsed && <span>{t.nav.settings}</span>}
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
              {!sidebarCollapsed && <span className="ml-2">{t.nav.collapse}</span>}
            </Button>
            {user && (
              <Button
                variant="ghost"
                className={`w-full ${
                  sidebarCollapsed ? 'justify-center px-0' : 'justify-start'
                } h-9 text-sm gap-2 text-muted-foreground hover:text-destructive`}
                onClick={signOut}
                title={sidebarCollapsed ? 'Sign out' : undefined}
              >
                <LogOut className="h-4 w-4" />
                {!sidebarCollapsed && <span>Sign out</span>}
              </Button>
            )}
            {/* Connection indicator in sidebar footer */}
            {!sidebarCollapsed && (
              <div className="pt-1">
                <ConnectionIndicator />
              </div>
            )}
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
            {NAV_KEYS.map((key) => {
              const isActive = activeView === key
              const label = getNavLabel(key, t)
              return (
                <Button
                  key={key}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-9 text-sm gap-2"
                  onClick={() => handleNav(key)}
                >
                  {NAV_ICONS[key]}
                  <span>{label}</span>
                </Button>
              )
            })}
            {/* Settings in mobile nav */}
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-9 text-sm gap-2"
              onClick={() => handleNav('settings')}
            >
              <Settings className="h-4 w-4" />
              <span>{t.nav.settings}</span>
            </Button>
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
            <div className="ml-auto">
              <ConnectionIndicator />
            </div>
          </div>

          {/* View content */}
          <div className="flex-1 overflow-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </RealtimeSetup>
  )
}

// ==================== Root with I18nProvider ====================

export default function Home() {
  return (
    <I18nProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </I18nProvider>
  )
}
