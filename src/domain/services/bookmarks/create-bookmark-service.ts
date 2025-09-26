import { z } from 'zod'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  bookmark: InsertBookmarkInput,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService
): Promise<string | DomainError> {
  // const response = await scrappingService.scrapping(bookmark.url)

  // if (!response) {
  //   return new FailedToCreateBookmark()
  // }

  const response =
    'Este link fala sobre a importância da IA no mercado de trabalho, como podemos utilizar ela para nos ajudar no nosso dia a dia'

  // send to IA to generate embedding
  const embedding = await embeddingService.generateEmbedding(response)

  if (!embedding) {
    return new FailedToCreateBookmark()
  }

  return response
}
