'use client'

import { useState, useEffect } from 'react'
import type { Workspace } from '@/types'

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await fetch('/api/workspaces')
        if (!res.ok) throw new Error('Failed to fetch workspaces')
        const workspaces: Workspace[] = await res.json()
        // Use the first (most recently updated) workspace
        if (workspaces.length > 0) {
          setWorkspace(workspaces[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }
    fetchWorkspace()
  }, [])

  return { workspace, workspaceId: workspace?.id, loading, error }
}
