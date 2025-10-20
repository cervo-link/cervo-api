import { trace } from '@opentelemetry/api'
import { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
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
  const tracer = trace.getTracer('create-bookmark')

  return tracer.startActiveSpan('create-bookmark', async span => {
    const response = await scrappingService.scrapping(params.url)
    if (response instanceof DomainError) {
      span.end()
      return response
    }

    const summarized = await summarizeService.summarize(response)
    if (summarized instanceof DomainError) {
      span.end()
      return summarized
    }

    const embedding = await embeddingService.generateEmbedding(
      summarized,
      tracer
    )
    if (embedding instanceof DomainError) {
      span.end()
      return embedding
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(params.url)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const urlHashId = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const result = await insertBookmark({
      ...params,
      urlHashId,
      embedding,
    })

    if (result instanceof DomainError) {
      span.end()
      return result
    }

    span.end()
    return result.url
  })
}
