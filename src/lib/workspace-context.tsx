'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Workspace } from '@/types'

// ==================== Types ====================

interface WorkspaceContextValue {
  workspace: Workspace | null
  workspaceId: string
  workspaceSlug: string
  loading: boolean
  error: string | null
  setWorkspace: (ws: Workspace | null) => void
}

// ==================== Context ====================

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  workspaceId: '',
  workspaceSlug: '',
  loading: true,
  error: null,
  setWorkspace: () => {},
})

export function useWorkspaceContext() {
  return useContext(WorkspaceContext)
}

// ==================== Provider ====================

interface WorkspaceProviderProps {
  children: ReactNode
  /** If provided, skip fetching and use this workspace */
  initialWorkspace?: Workspace | null
  /** If provided, fetch workspace by slug */
  slug?: string
}

export function WorkspaceProvider({ children, initialWorkspace, slug }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace ?? null)
  const [loading, setLoading] = useState(!initialWorkspace)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  const fetchBySlug = useCallback(async (workspaceSlug: string) => {
    const fetchId = ++fetchIdRef.current
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/workspaces?slug=${encodeURIComponent(workspaceSlug)}`)
      if (!res.ok) throw new Error('Workspace not found')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const ws = data[0]
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setWorkspace(ws)
          setLoading(false)
        }
      } else if (data && data.id) {
        // Single workspace returned
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setWorkspace(data as Workspace)
          setLoading(false)
        }
      } else {
        if (mountedRef.current && fetchId === fetchIdRef.current) {
          setError('Workspace not found')
          setLoading(false)
        }
      }
    } catch (err) {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace')
        setLoading(false)
      }
    }
  }, [])

  // If slug is provided, fetch workspace
  useEffect(() => {
    if (slug) {
      fetchBySlug(slug)
    } else if (!initialWorkspace) {
      // No slug and no initial workspace — try fetching first workspace
      const fetchId = ++fetchIdRef.current
      async function fetchFirst() {
        try {
          setLoading(true)
          const res = await fetch('/api/workspaces')
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0 && mountedRef.current && fetchId === fetchIdRef.current) {
              setWorkspace(data[0])
            }
          }
        } catch {
          // silent
        } finally {
          if (mountedRef.current && fetchId === fetchIdRef.current) {
            setLoading(false)
          }
        }
      }
      fetchFirst()
    }
  }, [slug, initialWorkspace, fetchBySlug])

  // If initialWorkspace changes, update state
  useEffect(() => {
    if (initialWorkspace) {
      setWorkspace(initialWorkspace)
      setLoading(false)
    }
  }, [initialWorkspace])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      fetchIdRef.current++
    }
  }, [])

  const value: WorkspaceContextValue = {
    workspace,
    workspaceId: workspace?.id ?? '',
    workspaceSlug: workspace?.slug ?? '',
    loading,
    error,
    setWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
