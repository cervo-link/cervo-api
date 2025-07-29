import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

export async function createWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  const result = await insertWorkspace(workspace)

  return result
}
