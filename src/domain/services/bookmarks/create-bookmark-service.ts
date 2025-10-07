import { z } from 'zod'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import { insertBookmark } from '@/infra/db/repositories/bookmark-repository'

import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  params: InsertBookmarkInput,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<string | DomainError> {
  const response = await scrappingService.scrapping(params.url)

  if (!response) {
    return new FailedToCreateBookmark()
  }

  const summarized = await summarizeService.summarize(response)
  if (!summarized) {
    return new FailedToSummarize()
  }

  const embedding = await embeddingService.generateEmbedding(summarized)

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

  return summarized
}
