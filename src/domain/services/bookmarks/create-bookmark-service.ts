import { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { getMembership } from '../membership/get-membership'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(bookmark: InsertBookmarkInput) {
  // move to controller later
  const membership = await getMembership(
    bookmark.workspaceId,
    bookmark.memberId
  )

  if (membership instanceof DomainError) {
    return membership
  }

  // scrapping do link
}
