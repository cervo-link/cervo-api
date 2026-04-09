import { eq, getTableColumns } from 'drizzle-orm'
import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import type { MembershipRole } from '@/infra/db/schema'
import { CannotCreateWorkspaceAlreadyExists } from '@/domain/errors/cannot-create-workspace-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { handleInsertError } from '@/infra/db/utils/insert-with-error-handling'

export async function insertWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  return withSpan('insert-workspace', async () => {
    const result = await handleInsertError(
      () => db.insert(schema.workspaces).values(workspace).returning(),
      CannotCreateWorkspaceAlreadyExists,
      'Failed to insert workspace'
    )

    if (result instanceof DomainError) return result
    if (!result) return new DomainError('Workspace not created', 500)
    return result
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

export async function findByMemberId(
  memberId: string
): Promise<Array<Workspace & { role: MembershipRole }>> {
  return withSpan('find-workspaces-by-member-id', async () => {
    return db
      .select({
        ...getTableColumns(schema.workspaces),
        role: schema.memberships.role,
      })
      .from(schema.memberships)
      .innerJoin(
        schema.workspaces,
        eq(schema.memberships.workspaceId, schema.workspaces.id)
      )
      .where(eq(schema.memberships.memberId, memberId))
  })
}

export async function updateWorkspaceById(
  id: string,
  data: Partial<Pick<InsertWorkspace, 'name' | 'description' | 'isPublic'>>
): Promise<Workspace | null> {
  return withSpan('update-workspace-by-id', async () => {
    const [result] = await db
      .update(schema.workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, id))
      .returning()
    return result ?? null
  })
}

export async function deleteWorkspaceById(id: string): Promise<void> {
  return withSpan('delete-workspace-by-id', async () => {
    await db
      .delete(schema.memberships)
      .where(eq(schema.memberships.workspaceId, id))

    await db
      .delete(schema.workspaceIntegrations)
      .where(eq(schema.workspaceIntegrations.workspaceId, id))

    await db
      .delete(schema.bookmarks)
      .where(eq(schema.bookmarks.workspaceId, id))

    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, id))
  })
}
