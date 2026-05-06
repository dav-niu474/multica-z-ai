'use client'

import { useWorkspaceContext } from '@/lib/workspace-context'

/**
 * Hook to get the current workspace.
 * Delegates to WorkspaceContext which is provided by both the root page
 * and the workspace layout routes.
 */
export function useWorkspace() {
  const { workspace, workspaceId, loading, error } = useWorkspaceContext()
  return { workspace, workspaceId: workspaceId || undefined, loading, error }
}
