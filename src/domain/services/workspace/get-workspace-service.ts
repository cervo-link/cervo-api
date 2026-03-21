import type { Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function getWorkspace(
  id: string
): Promise<Workspace | DomainError> {
  return withSpan('get-workspace', async () => {
    const workspace = await findById(id)

    if (!workspace) {
      return new WorkspaceNotFound()
    }

    return workspace
  })
}
