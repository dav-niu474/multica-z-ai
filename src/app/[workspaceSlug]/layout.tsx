import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { WorkspaceLayoutClient } from './workspace-layout-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgentHub - Workspace',
  description: 'Multi-Agent Team Collaboration Platform',
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params

  const workspace = await db().workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      _count: {
        select: {
          agents: true,
          issues: true,
          projects: true,
          members: true,
          skills: true,
          chatSessions: true,
        },
      },
    },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <WorkspaceLayoutClient initialWorkspace={workspace}>
      {children}
    </WorkspaceLayoutClient>
  )
}
