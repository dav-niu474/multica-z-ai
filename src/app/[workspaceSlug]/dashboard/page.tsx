'use client'

import dynamic from 'next/dynamic'

const DashboardView = dynamic(() => import('@/components/views/dashboard-view'), {
  loading: () => <div className="p-6"><div className="animate-pulse h-8 w-48 bg-muted rounded" /></div>,
})

export default function DashboardPage() {
  return <DashboardView />
}
