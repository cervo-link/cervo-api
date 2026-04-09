import { DomainError } from '@/domain/errors/domain-error'
import {
  deleteWorkspaceById,
  findById,
} from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function deleteWorkspace(
  workspaceId: string
): Promise<DomainError | null> {
  return withSpan('delete-workspace', async () => {
    const workspace = await findById(workspaceId)

    if (!workspace) return new DomainError('Workspace not found', 404)
    if (workspace.isPersonal)
      return new DomainError('Cannot delete a personal workspace', 403)

    await deleteWorkspaceById(workspaceId)
    return null
  })
}
