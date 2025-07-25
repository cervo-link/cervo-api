import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { CannotCreateWorkspaceDueConstraintError } from '@/domain/errors/cannot-create-workspace-due-constraint'
import type { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { DrizzleQueryError } from 'drizzle-orm/errors'

export async function insertWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  try {
    const [result] = await db
      .insert(schema.workspaces)
      .values(workspace)
      .returning()

    if (!result) {
      throw new Error('Workspace not created')
    }

    return result
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      return new CannotCreateWorkspaceDueConstraintError(
        (error.cause as { detail?: string })?.detail
      )
    }

    throw error
  }
}
