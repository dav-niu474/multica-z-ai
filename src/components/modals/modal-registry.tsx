'use client'

import { useModalStore } from '@/store/modal-store'
import { CreateIssueModal } from '@/components/modals/create-issue-modal'

export function ModalRegistry() {
  const { modal, data, close } = useModalStore()

  if (!modal) return null

  switch (modal) {
    case 'create-issue':
    case 'quick-create-issue':
      return (
        <CreateIssueModal
          open={!!modal}
          onOpenChange={(open) => {
            if (!open) close()
          }}
          defaultData={data}
        />
      )
    default:
      return null
  }
}
