import type { WorkspaceIntegration } from '@/domain/entities/workspace-integration'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { insertWorkspaceIntegration } from '@/infra/db/repositories/workspace-integrations-repository'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

type CreateWorkspaceIntegrationInput = {
  workspaceId: string
  provider: string
  providerId: string
}

export async function createWorkspaceIntegration(
  input: CreateWorkspaceIntegrationInput
): Promise<WorkspaceIntegration | DomainError> {
  return withSpan('create-workspace-integration', async () => {
    const workspace = await findById(input.workspaceId)
    if (!workspace) {
      return new WorkspaceNotFound()
    }

    return insertWorkspaceIntegration(input)
  })
}
