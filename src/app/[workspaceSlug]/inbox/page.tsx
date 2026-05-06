'use client'

import dynamic from 'next/dynamic'
import { useWorkspaceContext } from '@/lib/workspace-context'

const InboxView = dynamic(() => import('@/components/views/inbox-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function InboxPage() {
  return <InboxView />
}
