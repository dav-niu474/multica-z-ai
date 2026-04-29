'use client'

import { RealtimeProvider } from '@/lib/realtime-context'
import { ConnectionIndicator } from '@/components/realtime/connection-indicator'

interface RealtimeSetupProps {
  workspaceId: string
  children: React.ReactNode
}

/**
 * Wraps the app with realtime context and provides the connection indicator
 * via a named export for easy placement in headers.
 */
export function RealtimeSetup({ workspaceId, children }: RealtimeSetupProps) {
  if (!workspaceId) {
    return <>{children}</>
  }

  return (
    <RealtimeProvider workspaceId={workspaceId}>
      {children}
    </RealtimeProvider>
  )
}

// Re-export for convenience
export { RealtimeProvider } from '@/lib/realtime-context'
export { ConnectionIndicator } from '@/components/realtime/connection-indicator'
export { useRealtime } from '@/lib/realtime-context'
