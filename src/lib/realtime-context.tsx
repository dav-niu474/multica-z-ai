'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RealtimeContextValue {
  /** Whether the socket is currently connected */
  connected: boolean
  /** Whether the socket is actively reconnecting */
  reconnecting: boolean
  /** The workspace room we're currently joined to */
  room: string | null
  /** Emit an event to the current workspace room (client-side) */
  emitEvent: (eventType: string, data?: Record<string, unknown>) => void
  /** Subscribe to a realtime event. Returns a cleanup function. */
  onEvent: (eventType: string, handler: (data: unknown) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  reconnecting: false,
  room: null,
  emitEvent: () => {},
  onEvent: () => () => {},
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RealtimeProviderProps {
  workspaceId: string
  children: React.ReactNode
}

export function RealtimeProvider({ workspaceId, children }: RealtimeProviderProps) {
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const handlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map())
  const joinedRoomRef = useRef<string | null>(null)

  // Connect socket
  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      setReconnecting(false)
    })

    s.on('disconnect', (reason) => {
      setConnected(false)
      if (reason === 'io server disconnect') {
        // Server forced disconnect, don't auto-reconnect
        setReconnecting(false)
      } else {
        setReconnecting(true)
      }
    })

    s.on('connect_error', (err) => {
      console.warn('[Realtime] Connection error:', err.message)
      setReconnecting(true)
    })

    s.on('reconnect_attempt', () => {
      setReconnecting(true)
    })

    s.on('reconnect', () => {
      setReconnecting(false)
    })

    s.on('reconnect_failed', () => {
      setReconnecting(false)
    })

    // Central dispatcher for all registered handlers
    const eventNames = [
      'issue:updated',
      'agent:status-changed',
      'chat:message-received',
      'task:progress-updated',
      'workspace:members',
      'workspace:member-joined',
      'workspace:member-left',
    ]

    const dispatch = (eventType: string) => (data: unknown) => {
      const handlers = handlersRef.current.get(eventType)
      if (handlers) {
        handlers.forEach((handler) => handler(data))
      }
    }

    eventNames.forEach((eventType) => {
      s.on(eventType, dispatch(eventType))
    })

    return () => {
      eventNames.forEach((eventType) => {
        s.off(eventType, dispatch(eventType))
      })
      s.removeAllListeners()
      s.disconnect()
      socketRef.current = null
      setConnected(false)
      setReconnecting(false)
    }
  }, [])

  // Join/leave workspace room when workspaceId changes
  useEffect(() => {
    const s = socketRef.current
    if (!s) return

    if (workspaceId) {
      // Leave previous room
      if (joinedRoomRef.current && joinedRoomRef.current !== workspaceId) {
        s.emit('leave-workspace', { workspaceId: joinedRoomRef.current })
      }

      const roomName = `workspace:${workspaceId}`
      s.emit('join-workspace', { workspaceId })
      joinedRoomRef.current = workspaceId
      // Derive room from workspaceId instead of separate state
    }

    return () => {
      if (joinedRoomRef.current) {
        s.emit('leave-workspace', { workspaceId: joinedRoomRef.current })
        joinedRoomRef.current = null
      }
    }
  }, [workspaceId])

  // Emit event to current workspace room
  const emitEvent = useCallback(
    (eventType: string, data?: Record<string, unknown>) => {
      const s = socketRef.current
      if (!s || !workspaceId) return

      // Map external event names to internal socket event names
      const eventMap: Record<string, string> = {
        'issue:update': 'issue:update',
        'agent:status': 'agent:status',
        'chat:message': 'chat:message',
        'task:progress': 'task:progress',
      }

      const socketEvent = eventMap[eventType] ?? eventType
      s.emit(socketEvent, { workspaceId, ...data })
    },
    [workspaceId]
  )

  // Subscribe to an event — returns an unsubscribe function
  const onEvent = useCallback((eventType: string, handler: (data: unknown) => void) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set())
    }
    handlersRef.current.get(eventType)!.add(handler)

    return () => {
      handlersRef.current.get(eventType)?.delete(handler)
    }
  }, [])

  const room = workspaceId ? `workspace:${workspaceId}` : null

  const value: RealtimeContextValue = {
    connected,
    reconnecting,
    room,
    emitEvent,
    onEvent,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
