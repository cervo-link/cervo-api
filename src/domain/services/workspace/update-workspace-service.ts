import type { Workspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import {
  findById,
  updateWorkspaceById,
} from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

interface UpdateWorkspaceInput {
  name?: string
  description?: string | null
  isPublic?: boolean
}

export async function updateWorkspace(
  workspaceId: string,
  requestingMemberId: string,
  data: UpdateWorkspaceInput
): Promise<Workspace | DomainError> {
  return withSpan('update-workspace', async () => {
    const workspace = await findById(workspaceId)

    if (!workspace) return new WorkspaceNotFound()
    if (workspace.isPersonal)
      return new DomainError('Cannot edit a personal workspace', 403)
    if (workspace.ownerId !== requestingMemberId)
      return new DomainError('Only the workspace owner can edit it', 403)

    const updated = await updateWorkspaceById(workspaceId, data)
    if (!updated) return new DomainError('Failed to update workspace', 500)

    return updated
  })
}
