'use client'

import dynamic from 'next/dynamic'

const AgentsView = dynamic(() => import('@/components/views/agents-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function AgentsPage() {
  return <AgentsView />
}
