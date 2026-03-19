import { trace } from '@opentelemetry/api'
import { z } from 'zod'
import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import { insertBookmark } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'
import { processBookmark } from './process-bookmark-service'

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
): Promise<Bookmark | DomainError> {
  const tracer = trace.getTracer('create-bookmark')

  return tracer.startActiveSpan('create-bookmark-service', async span => {
    const urlHashId = await generateUrlHashId(params.url)

    const result = await insertBookmark({
      ...params,
      urlHashId,
      status: 'submitted',
    })

    if (result instanceof DomainError) {
      span.end()
      return result
    }

    setImmediate(() => {
      processBookmark(result.id, scrappingService, embeddingService, summarizeService)
    })

    span.end()
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
