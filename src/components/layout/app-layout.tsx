'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Layers,
  Inbox,
  UserCircle,
  Kanban,
  FolderKanban,
  Bot,
  Zap,
  Sparkles,
  Server,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { ConnectionIndicator } from '@/components/realtime/connection-indicator'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-session'
import { useModalStore } from '@/store/modal-store'
import { useWorkspaceContext } from '@/lib/workspace-context'
import type { ViewType } from '@/types'
import { cn } from '@/lib/utils'

// ==================== Dynamic imports ====================

const RealtimeSetup = dynamic(
  () => import('@/components/realtime/realtime-provider').then(m => ({ default: m.RealtimeSetup })),
  { ssr: false }
)
const SearchCommand = dynamic(() => import('@/components/search/search-command'), { ssr: false })
const ChatWindow = dynamic(() => import('@/components/chat/chat-window'), { ssr: false })
const ModalRegistry = dynamic(() => import('@/components/modals/modal-registry'), { ssr: false })

// ==================== Navigation Configuration ====================

interface NavItem {
  key: ViewType
  labelKey: keyof typeof import('@/lib/i18n/locales/en').default.nav
  icon: LucideIcon
  path: string
  showBadge?: boolean
}

interface NavSection {
  id: string
  labelKey: keyof typeof import('@/lib/i18n/locales/en').default.nav
  items: NavItem[]
}

function buildNavSections(workspaceSlug: string): NavSection[] {
  const prefix = workspaceSlug ? `/${workspaceSlug}` : ''
  return [
    {
      id: 'personal',
      labelKey: 'personal',
      items: [
        { key: 'inbox', labelKey: 'inbox', icon: Inbox, path: `${prefix}/inbox`, showBadge: true },
        { key: 'my-issues', labelKey: 'myIssues', icon: UserCircle, path: `${prefix}/my-issues` },
      ],
    },
    {
      id: 'workspace',
      labelKey: 'workspace',
      items: [
        { key: 'issues', labelKey: 'issues', icon: Kanban, path: `${prefix}/issues` },
        { key: 'projects', labelKey: 'projects', icon: FolderKanban, path: `${prefix}/projects` },
        { key: 'agents', labelKey: 'agents', icon: Bot, path: `${prefix}/agents` },
      ],
    },
    {
      id: 'automation',
      labelKey: 'automation',
      items: [
        { key: 'autopilots', labelKey: 'autopilots', icon: Zap, path: `${prefix}/autopilots` },
      ],
    },
    {
      id: 'configure',
      labelKey: 'configure',
      items: [
        { key: 'skills', labelKey: 'skills', icon: Sparkles, path: `${prefix}/skills` },
        { key: 'runtimes', labelKey: 'runtimes', icon: Server, path: `${prefix}/runtimes` },
        { key: 'members', labelKey: 'members', icon: Users, path: `${prefix}/members` },
        { key: 'settings', labelKey: 'settings', icon: Settings, path: `${prefix}/settings` },
      ],
    },
  ]
}

// ==================== Skeleton ====================

function LayoutSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-[60px] border-r flex flex-col items-center py-4 gap-3">
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

// ==================== Sidebar Nav Button ====================

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onClick,
  badgeCount,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onClick: () => void
  badgeCount?: number
}) {
  const Icon = item.icon

  const button = (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'w-full h-9 text-sm gap-2 shrink-0',
        collapsed ? 'justify-center px-0' : 'justify-start px-2'
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="truncate flex-1 text-left">{item.labelKey}</span>
      )}
      {!collapsed && item.showBadge && badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          variant="default"
          className="h-5 min-w-[20px] px-1.5 text-[10px] font-semibold shrink-0"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </Badge>
      )}
      {collapsed && item.showBadge && badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
      )}
    </Button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{button}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.labelKey}
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge variant="default" className="h-4 px-1 text-[9px]">
              {badgeCount}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

// ==================== Auth Guard ====================

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, authenticated, loading } = useAuth()

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
            onClick={() => { window.location.href = '/login' }}
          >
            <Layers className="h-4 w-4" />
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

// ==================== Desktop Sidebar ====================

function DesktopSidebar({
  activePath,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onSignOut,
  inboxBadge,
  navSections,
}: {
  activePath: string
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate: (path: string) => void
  onSignOut: () => void
  inboxBadge: number
  navSections: NavSection[]
}) {
  const { workspace } = useWorkspaceContext()
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        'hidden lg:flex border-r bg-card flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Workspace Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {workspace?.name || 'AgentHub'}
              </p>
              {workspace?.slug && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {workspace.slug}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {navSections.map((section, sectionIdx) => (
            <div key={section.id}>
              {sectionIdx > 0 && (
                <Separator className="my-2" />
              )}
              {!collapsed && (
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.nav[section.labelKey as keyof typeof t.nav] ?? section.labelKey}
                </p>
              )}
              {collapsed && sectionIdx > 0 && (
                <div className="my-1.5" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
                    collapsed={collapsed}
                    onClick={() => onNavigate(item.path)}
                    badgeCount={item.key === 'inbox' ? inboxBadge : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t space-y-1">
        {/* Connection indicator */}
        <div className={cn(
          'flex items-center',
          collapsed ? 'justify-center' : 'px-2'
        )}>
          <ConnectionIndicator />
        </div>

        {/* Collapse button */}
        <SidebarNavItem
          item={{
            key: 'settings' as ViewType,
            labelKey: 'collapse' as NavItem['labelKey'],
            icon: collapsed ? ChevronRight : ChevronLeft,
            path: '#collapse',
          }}
          isActive={false}
          collapsed={collapsed}
          onClick={onToggleCollapse}
        />

        {/* Sign out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full h-9 text-sm gap-2 text-muted-foreground hover:text-destructive shrink-0',
                collapsed ? 'justify-center px-0' : 'justify-start px-2'
              )}
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Sign out</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Sign out</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  )
}

// ==================== Mobile Sidebar ====================

function MobileSidebar({
  activePath,
  open,
  onOpenChange,
  onNavigate,
  onSignOut,
  inboxBadge,
  navSections,
}: {
  activePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (path: string) => void
  onSignOut: () => void
  inboxBadge: number
  navSections: NavSection[]
}) {
  const { workspace } = useWorkspaceContext()
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* Workspace header */}
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate">{workspace?.name || 'AgentHub'}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navSections.map((section, sectionIdx) => (
              <div key={section.id}>
                {sectionIdx > 0 && (
                  <Separator className="my-2" />
                )}
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.nav[section.labelKey as keyof typeof t.nav] ?? section.labelKey}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.key}
                        variant={activePath === item.path || activePath.startsWith(item.path + '/') ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-9 text-sm gap-2 px-2"
                        onClick={() => {
                          onNavigate(item.path)
                          onOpenChange(false)
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1 text-left">{t.nav[item.labelKey as keyof typeof t.nav] ?? item.labelKey}</span>
                        {item.showBadge && inboxBadge > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-[20px] px-1.5 text-[10px] font-semibold shrink-0"
                          >
                            {inboxBadge > 99 ? '99+' : inboxBadge}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <ConnectionIndicator />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 text-sm gap-2 px-2 text-muted-foreground hover:text-destructive"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ==================== Main App Layout ====================

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { t } = useTranslation()
  const { open: openModal } = useModalStore()
  const { workspace, workspaceId, workspaceSlug, loading: wsLoading } = useWorkspaceContext()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inboxBadge, setInboxBadge] = useState(0)

  const navSections = buildNavSections(workspaceSlug)

  // Fetch inbox badge count
  useEffect(() => {
    if (!workspaceId) return
    async function fetchBadge() {
      try {
        const res = await fetch(`/api/inbox?limit=1&unreadOnly=true`)
        if (res.ok) {
          const data = await res.json()
          const items = Array.isArray(data) ? data : data.items || []
          setInboxBadge(items.length)
        }
      } catch {
        // silent
      }
    }
    fetchBadge()
    const interval = setInterval(fetchBadge, 30000)
    return () => clearInterval(interval)
  }, [workspaceId])

  const handleNavigate = useCallback((path: string) => {
    if (path === '#collapse') return
    setMobileMenuOpen(false)
    router.push(path)
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        if (!isInput) {
          e.preventDefault()
          openModal('quick-create-issue')
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openModal])

  if (wsLoading) {
    return <LayoutSkeleton />
  }

  return (
    <RealtimeSetup workspaceId={workspaceId}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <DesktopSidebar
          activePath={pathname}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          onSignOut={signOut}
          inboxBadge={inboxBadge}
          navSections={navSections}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          activePath={pathname}
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          onNavigate={handleNavigate}
          onSignOut={signOut}
          inboxBadge={inboxBadge}
          navSections={navSections}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                {workspace?.name || 'AgentHub'}
              </span>
            </div>
            <div className="ml-auto">
              <ConnectionIndicator />
            </div>
          </div>

          {/* View content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        {/* Floating elements */}
        <ChatWindow workspaceId={workspaceId} />
        <ModalRegistry />
      </div>
    </RealtimeSetup>
  )
}
