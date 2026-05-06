'use client'

import { I18nProvider } from '@/lib/i18n'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { AppLayout, AuthGuard } from '@/components/layout/app-layout'
import type { Workspace } from '@/types'

export function WorkspaceLayoutClient({
  children,
  initialWorkspace,
}: {
  children: React.ReactNode
  initialWorkspace: Workspace
}) {
  return (
    <I18nProvider>
      <AuthGuard>
        <WorkspaceProvider initialWorkspace={initialWorkspace}>
          <AppLayout>
            {children}
          </AppLayout>
        </WorkspaceProvider>
      </AuthGuard>
    </I18nProvider>
  )
}
