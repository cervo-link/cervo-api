import { z } from 'zod'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { scrappingBeeAdapter } from '@/infra/adapters/scrapping-bee'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  bookmark: InsertBookmarkInput
): Promise<string | DomainError> {
  const response = await scrappingBeeAdapter(bookmark.url)
    .then(response => {
      const decoder = new TextDecoder()
      const text = decoder.decode(response.data)

      return text
    })
    .catch(e => console.log(`A problem occurred : ${e.response.data}`))

  if (!response) {
    return new FailedToCreateBookmark()
  }

  return response
}
