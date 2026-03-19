import type {
  InsertWorkspaceIntegration,
  WorkspaceIntegration,
} from '@/domain/entities/workspace-integration'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspaceIntegration } from '@/infra/db/repositories/workspace-integrations-repository'

type Overrides = Partial<Omit<InsertWorkspaceIntegration, 'workspaceId'>> & {
  workspaceId: string
}

export function makeRawWorkspaceIntegration(
  overrides: Overrides
): InsertWorkspaceIntegration {
  return {
    workspaceId: overrides.workspaceId,
    provider: overrides.provider ?? 'discord',
    providerId: overrides.providerId ?? `guild-${Date.now()}`,
  }
}

export async function makeWorkspaceIntegration(
  overrides: Overrides
): Promise<WorkspaceIntegration> {
  const result = await insertWorkspaceIntegration(makeRawWorkspaceIntegration(overrides))
  if (result instanceof DomainError) throw result
  return result
}
