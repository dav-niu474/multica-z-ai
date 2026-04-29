'use client'

import { useRealtime } from '@/lib/realtime-context'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

/**
 * Subtle connection indicator that shows when the realtime socket is disconnected.
 * Renders inline — intended to be placed in the app header or top bar area.
 */
export function ConnectionIndicator() {
  const { connected, reconnecting } = useRealtime()

  if (connected) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-500" title="Connected to realtime service">
        <Wifi className="h-3 w-3" />
        <span className="text-[10px] font-medium hidden sm:inline">Live</span>
      </div>
    )
  }

  if (reconnecting) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500 animate-pulse" title="Reconnecting to realtime service...">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-[10px] font-medium">Reconnecting...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground" title="Not connected to realtime service">
      <WifiOff className="h-3 w-3" />
      <span className="text-[10px] font-medium hidden sm:inline">Offline</span>
    </div>
  )
}
