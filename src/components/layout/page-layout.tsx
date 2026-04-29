'use client';

import type { ReactNode } from 'react';
import { Sidebar, SidebarToggle } from './sidebar';
import { useAppStore } from '@/store/app-store';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Bot,
  CircleDot,
  MessageSquare,
  Zap,
  FolderKanban,
} from 'lucide-react';

const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  agents: 'Agents',
  issues: 'Issues',
  chat: 'Chat',
  skills: 'Skills',
  projects: 'Projects',
};

const viewIcons: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard className="size-4 text-muted-foreground" />,
  agents: <Bot className="size-4 text-muted-foreground" />,
  issues: <CircleDot className="size-4 text-muted-foreground" />,
  chat: <MessageSquare className="size-4 text-muted-foreground" />,
  skills: <Zap className="size-4 text-muted-foreground" />,
  projects: <FolderKanban className="size-4 text-muted-foreground" />,
};

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { currentView, workspaceName } = useAppStore();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarToggle />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{workspaceName}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="flex items-center gap-1.5 font-medium">
              {viewIcons[currentView]}
              {viewLabels[currentView]}
            </span>
          </nav>

          <div className="ml-auto" />
        </header>

        <Separator />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
