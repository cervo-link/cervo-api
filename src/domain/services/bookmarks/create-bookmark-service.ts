import { z } from 'zod'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { insertBookmark } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  params: InsertBookmarkInput,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService
): Promise<string | DomainError> {
  const response = await scrappingService.scrapping(params.url)

  if (!response) {
    return new FailedToCreateBookmark()
  }

  const embedding = await embeddingService.generateEmbedding(response)

  if (!embedding) {
    return new FailedToCreateBookmark()
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(params.url)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const urlHashId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  await insertBookmark({
    ...params,
    urlHashId,
    embedding,
  })

  return response
}
