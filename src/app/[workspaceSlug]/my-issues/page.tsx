'use client'

import dynamic from 'next/dynamic'

const MyIssuesView = dynamic(() => import('@/components/views/my-issues-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function MyIssuesPage() {
  return <MyIssuesView />
}
