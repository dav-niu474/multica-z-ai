'use client';

import {
  LayoutDashboard,
  Bot,
  CircleDot,
  MessageSquare,
  Zap,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAppStore } from '@/store/app-store';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ViewType } from '@/types';

interface NavItem {
  label: string;
  view: ViewType;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard className="size-4" /> },
  { label: 'Agents', view: 'agents', icon: <Bot className="size-4" /> },
  { label: 'Issues', view: 'issues', icon: <CircleDot className="size-4" /> },
  { label: 'Chat', view: 'chat', icon: <MessageSquare className="size-4" /> },
  { label: 'Skills', view: 'skills', icon: <Zap className="size-4" /> },
  { label: 'Projects', view: 'projects', icon: <FolderKanban className="size-4" /> },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setView, workspaceName } = useAppStore();

  const handleNavClick = (view: ViewType) => {
    setView(view);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Bot className="size-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">AgentHub</span>
          <span className="text-xs text-muted-foreground mt-0.5">Team Collaboration</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Button
              key={item.view}
              variant={currentView === item.view ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2 text-sm font-normal',
                currentView === item.view && 'font-medium'
              )}
              onClick={() => handleNavClick(item.view)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Workspace info at bottom */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-muted">
            <FolderKanban className="size-3 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate">{workspaceName}</span>
            <Badge variant="outline" className="w-fit text-[10px] px-1 py-0 mt-0.5">
              Free
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-300',
        'w-60 shrink-0'
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function SidebarToggle() {
  const isMobile = useIsMobile();
  const { toggleSidebar } = useAppStore();

  if (!isMobile) return null;

  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
      <PanelLeftOpen className="size-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}
