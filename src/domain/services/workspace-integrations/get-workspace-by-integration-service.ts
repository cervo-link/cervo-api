import type { Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findWorkspaceByIntegration } from '@/infra/db/repositories/workspace-integrations-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function getWorkspaceByIntegration(
  provider: string,
  providerId: string
): Promise<Workspace | DomainError> {
  return withSpan('get-workspace-by-integration', async () => {
    const workspace = await findWorkspaceByIntegration(provider, providerId)

    if (!workspace) {
      return new WorkspaceNotFound()
    }

    return workspace
  })
}
