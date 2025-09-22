import { z } from 'zod'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import type { ScrappingService } from '@/infra/ports/scrapping'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  bookmark: InsertBookmarkInput,
  scrappingService: ScrappingService
): Promise<string | DomainError> {
  const response = await scrappingService.scrapping(bookmark.url)

  if (!response) {
    return new FailedToCreateBookmark()
  }

  return response
}
