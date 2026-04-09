import { and, asc, eq } from 'drizzle-orm'
import type { InsertMembership, Membership } from '@/domain/entities/membership'
import { CannotCreateMembershipAlreadyExists } from '@/domain/errors/cannot-create-membership-already-exists'
import type { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { type MembershipRole, members, memberships } from '@/infra/db/schema'
import { handleInsertError } from '@/infra/db/utils/insert-with-error-handling'

export async function insertMembership(
  membership: InsertMembership
): Promise<Membership | DomainError> {
  return withSpan('insert-membership', () =>
    handleInsertError(
      () => db.insert(memberships).values(membership).returning(),
      CannotCreateMembershipAlreadyExists,
      'Failed to insert membership'
    )
  )
}

export async function findMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership | null> {
  return withSpan('find-membership', async () => {
    const [result] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.memberId, memberId)
        )
      )
    return result
  })
}

export async function findMembershipRole(
  workspaceId: string,
  memberId: string
): Promise<MembershipRole | null> {
  return withSpan('find-membership-role', async () => {
    const [result] = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.memberId, memberId)
        )
      )
    return result?.role ?? null
  })
}

export async function updateMembershipRole(
  workspaceId: string,
  memberId: string,
  role: MembershipRole
): Promise<Membership | null> {
  return withSpan('update-membership-role', async () => {
    const [result] = await db
      .update(memberships)
      .set({ role })
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.memberId, memberId)
        )
      )
      .returning()
    return result ?? null
  })
}

export type WorkspaceMember = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  role: MembershipRole
  joinedAt: Date
}

export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  return withSpan('list-workspace-members', () =>
    db
      .select({
        id: members.id,
        name: members.name,
        username: members.username,
        email: members.email,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(members, eq(memberships.memberId, members.id))
      .where(eq(memberships.workspaceId, workspaceId))
      .orderBy(asc(memberships.createdAt))
  )
}

export async function deleteMembership(
  workspaceId: string,
  memberId: string
): Promise<boolean> {
  return withSpan('delete-membership', async () => {
    const result = await db
      .delete(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.memberId, memberId)
        )
      )
      .returning()
    return result.length > 0
  })
}
