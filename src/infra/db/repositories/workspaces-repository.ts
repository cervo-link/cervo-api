import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { CannotCreateWorkspaceDueConstraintError } from '@/domain/errors/cannot-create-workspace-due-constraint'
import type { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

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
    const pgError = getPgError(error)
    if (pgError) {
      if (pgError.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new CannotCreateWorkspaceDueConstraintError(pgError.detail)
      }
    }

    throw error
  }
}
