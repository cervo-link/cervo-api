import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

export async function createWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | Error> {
  const result = await insertWorkspace(workspace)

  return result
}
