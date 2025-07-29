import { z } from 'zod'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findById as findMemberById } from '@/infra/db/repositories/members-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(bookmark: InsertBookmarkInput) {
  const member = await findMemberById(bookmark.memberId)

  if (!member) {
    return new MemberNotFound()
  }

  const workspace = await findWorkspaceById(bookmark.workspaceId)

  if (!workspace) {
    return new WorkspaceNotFound()
  }

  // scrapping do link
}
