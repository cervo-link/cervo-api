import { trace } from '@opentelemetry/api'
import { eq } from 'drizzle-orm'
import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { CannotCreateWorkspaceAlreadyExists } from '@/domain/errors/cannot-create-workspace-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
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
        return new CannotCreateWorkspaceAlreadyExists()
      }
    }

    return new DomainError(
      `Failed to insert workspace due error: ${error as string}`,
      500
    )
  }
}

export async function findById(id: string): Promise<Workspace | null> {
  const tracer = trace.getTracer('find-workspace')

  return tracer.startActiveSpan(
    'find-workspace-by-idrepository',
    async span => {
      const [result] = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, id))
      span.end()
      return result
    }
  )
}
