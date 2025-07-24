import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'

export async function insertWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace> {
  const [result] = await db
    .insert(schema.workspaces)
    .values(workspace)
    .returning()

  if (!result) {
    throw new Error('Workspace not created')
  }

  return result
}
