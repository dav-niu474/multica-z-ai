'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
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
  Search,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { ViewType } from '@/types'

interface SearchCommandProps {
  onNavigate?: (view: ViewType) => void
}

const SEARCH_ITEMS: { key: ViewType; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'inbox', labelKey: 'nav.inbox', icon: <Inbox className="h-4 w-4" /> },
  { key: 'my-issues', labelKey: 'nav.myIssues', icon: <UserCircle className="h-4 w-4" /> },
  { key: 'issues', labelKey: 'nav.issues', icon: <Kanban className="h-4 w-4" /> },
  { key: 'projects', labelKey: 'nav.projects', icon: <FolderKanban className="h-4 w-4" /> },
  { key: 'agents', labelKey: 'nav.agents', icon: <Bot className="h-4 w-4" /> },
  { key: 'autopilots', labelKey: 'nav.autopilots', icon: <Zap className="h-4 w-4" /> },
  { key: 'skills', labelKey: 'nav.skills', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'runtimes', labelKey: 'nav.runtimes', icon: <Server className="h-4 w-4" /> },
  { key: 'members', labelKey: 'nav.members', icon: <Users className="h-4 w-4" /> },
  { key: 'settings', labelKey: 'nav.settings', icon: <Settings className="h-4 w-4" /> },
]

export default function SearchCommand({ onNavigate }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = useCallback((view: ViewType) => {
    setOpen(false)
    onNavigate?.(view)
  }, [onNavigate])

  const getLabel = (key: string): string => {
    const keys = key.split('.')
    let val: unknown = t
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k]
      } else {
        val = undefined
      }
    }
    return typeof val === 'string' ? val : key
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t.nav.searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{t.nav.noResults}</CommandEmpty>
        <CommandGroup heading="Navigation">
          {SEARCH_ITEMS.map((item) => (
            <CommandItem
              key={item.key}
              onSelect={() => handleSelect(item.key)}
              className="gap-3"
            >
              {item.icon}
              <span>{getLabel(item.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  )
}
