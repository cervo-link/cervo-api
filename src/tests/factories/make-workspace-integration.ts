import type {
  InsertWorkspaceIntegration,
  WorkspaceIntegration,
} from '@/domain/entities/workspace-integration'
import { insertWorkspaceIntegration } from '@/infra/db/repositories/workspace-integrations-repository'
import { unwrapOrThrow } from './unwrap'

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
  return unwrapOrThrow(
    await insertWorkspaceIntegration(makeRawWorkspaceIntegration(overrides))
  )
}
