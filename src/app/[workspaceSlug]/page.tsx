'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceContext } from '@/lib/workspace-context'

export default function WorkspaceIndexPage() {
  const router = useRouter()
  const { workspaceSlug } = useWorkspaceContext()

  useEffect(() => {
    if (workspaceSlug) {
      router.replace(`/${workspaceSlug}/issues`)
    }
  }, [workspaceSlug, router])

  return null
}
