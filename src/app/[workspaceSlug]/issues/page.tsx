'use client'

import dynamic from 'next/dynamic'
import { useWorkspaceContext } from '@/lib/workspace-context'

const IssuesView = dynamic(() => import('@/components/views/issues-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function IssuesPage() {
  const { workspaceId } = useWorkspaceContext()
  return <IssuesView workspaceId={workspaceId} />
}
