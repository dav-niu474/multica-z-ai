'use client'

import dynamic from 'next/dynamic'
import { useWorkspaceContext } from '@/lib/workspace-context'

const AutopilotsView = dynamic(() => import('@/components/views/autopilots-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function AutopilotsPage() {
  return <AutopilotsView />
}
