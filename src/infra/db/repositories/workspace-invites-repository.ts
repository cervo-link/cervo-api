import { eq } from 'drizzle-orm'
import type {
  InsertWorkspaceInvite,
  WorkspaceInvite,
} from '@/domain/entities/workspace-invite'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { members, workspaceInvites, workspaces } from '@/infra/db/schema'

export async function insertWorkspaceInvite(
  invite: InsertWorkspaceInvite
): Promise<WorkspaceInvite> {
  return withSpan('insert-workspace-invite', async () => {
    const [result] = await db
      .insert(workspaceInvites)
      .values(invite)
      .returning()
    return result
  })
}

export async function findByToken(
  token: string
): Promise<WorkspaceInvite | null> {
  return withSpan('find-invite-by-token', async () => {
    const [result] = await db
      .select()
      .from(workspaceInvites)
      .where(eq(workspaceInvites.token, token))
    return result ?? null
  })
}

export type InviteInfo = {
  workspaceName: string
  inviterName: string | null
  role: string
  expiresAt: Date
  usedAt: Date | null
}

export async function findInviteInfoByToken(
  token: string
): Promise<InviteInfo | null> {
  return withSpan('find-invite-info-by-token', async () => {
    const [result] = await db
      .select({
        workspaceName: workspaces.name,
        inviterName: members.name,
        role: workspaceInvites.role,
        expiresAt: workspaceInvites.expiresAt,
        usedAt: workspaceInvites.usedAt,
      })
      .from(workspaceInvites)
      .innerJoin(
        workspaces,
        eq(workspaceInvites.workspaceId, workspaces.id)
      )
      .innerJoin(members, eq(workspaceInvites.createdBy, members.id))
      .where(eq(workspaceInvites.token, token))
    return result ?? null
  })
}

export async function markInviteAsUsed(
  token: string,
  usedBy: string
): Promise<WorkspaceInvite | null> {
  return withSpan('mark-invite-as-used', async () => {
    const [result] = await db
      .update(workspaceInvites)
      .set({ usedAt: new Date(), usedBy })
      .where(eq(workspaceInvites.token, token))
      .returning()
    return result ?? null
  })
}
