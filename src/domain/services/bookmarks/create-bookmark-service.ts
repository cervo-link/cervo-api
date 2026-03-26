import { z } from 'zod'
import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import { insertBookmark } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'
import { withSpan } from '@/infra/utils/with-span'
import { processBookmark } from './process-bookmark-service'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
  source: z.string().default('web'),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(
  params: InsertBookmarkInput,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<Bookmark | DomainError> {
  return withSpan('create-bookmark', async () => {
    const urlHashId = await generateUrlHashId(params.url)

    const result = await insertBookmark({
      ...params,
      urlHashId,
      status: 'submitted',
    })

    if (result instanceof DomainError) {
      return result
    }

    setImmediate(() => {
      processBookmark(result.id, scrappingService, embeddingService, summarizeService)
    })

    return result
  })
}

async function generateUrlHashId(url: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(url)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
