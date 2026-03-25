import { eq, inArray } from 'drizzle-orm'
import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { CannotCreateWorkspaceAlreadyExists } from '@/domain/errors/cannot-create-workspace-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

export async function insertWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  return withSpan('insert-workspace', async () => {
    try {
      const [result] = await db
        .insert(schema.workspaces)
        .values(workspace)
        .returning()

      if (!result) {
        return new DomainError('Workspace not created', 500)
      }

      return result
    } catch (error) {
      const pgError = getPgError(error)
      if (pgError?.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new CannotCreateWorkspaceAlreadyExists()
      }
      return new DomainError(
        `Failed to insert workspace due error: ${error as string}`,
        500
      )
    }
  })
}

export async function findById(id: string): Promise<Workspace | null> {
  return withSpan('find-workspace-by-id', async () => {
    const [result] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, id))
    return result
  })
}

export async function findByOwnerId(
  ownerId: string
): Promise<Workspace | null> {
  return withSpan('find-workspace-by-owner-id', async () => {
    const [result] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.ownerId, ownerId))
    return result || null
  })
}

export async function findByMemberId(memberId: string): Promise<Workspace[]> {
  return withSpan('find-workspaces-by-member-id', async () => {
    const memberships = await db
      .select({ workspaceId: schema.memberships.workspaceId })
      .from(schema.memberships)
      .where(eq(schema.memberships.memberId, memberId))

    if (memberships.length === 0) return []

    return db
      .select()
      .from(schema.workspaces)
      .where(
        inArray(
          schema.workspaces.id,
          memberships.map(m => m.workspaceId)
        )
      )
  })
}
