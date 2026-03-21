import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function createWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  return withSpan('create-workspace', async () => {
    const result = await insertWorkspace(workspace)
    if (result instanceof DomainError) {
      return result
    }

    if (!workspace.ownerId) {
      return new DomainError('Owner ID is required', 400)
    }

    return result
  })
}
