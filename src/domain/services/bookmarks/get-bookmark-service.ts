import { trace } from '@opentelemetry/api'
import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import { findBookmarks } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { SummarizeService } from '@/infra/ports/summarize'

export type GetBookmarksInput = {
  workspaceId: string
  memberId: string
  text: string
  limit: number
}

export type BookmarkWithoutEmbedding = Omit<Bookmark, 'embedding'>

export type BookmarkWithExplanation = BookmarkWithoutEmbedding & {
  matchedBecause?: string
}

export async function getBookmarks(
  input: GetBookmarksInput,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<BookmarkWithExplanation[] | DomainError> {
  const tracer = trace.getTracer('get-bookmarks-service')

  return tracer.startActiveSpan('get-bookmarks-service', async span => {
    const embedded = await embeddingService.generateEmbedding(input.text, tracer)
    if (embedded instanceof DomainError) {
      span.end()
      return embedded
    }

    const bookmarks = await findBookmarks(input.workspaceId, embedded, input.limit)

    if (bookmarks.length === 0) {
      span.end()
      return []
    }

    const summaries = bookmarks.map(b => b.description ?? b.url)
    const explanations = await summarizeService.explain(input.text, summaries, tracer)

    const results: BookmarkWithExplanation[] = bookmarks.map((b, i) => ({
      ...b,
      matchedBecause:
        explanations instanceof DomainError ? undefined : explanations[i],
    }))

    span.end()
    return results
  })
}
