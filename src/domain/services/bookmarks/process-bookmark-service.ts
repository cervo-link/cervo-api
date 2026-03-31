import { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarkById,
  updateBookmark,
} from '@/infra/db/repositories/bookmark-repository'
import { logger } from '@/infra/logger'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'
import { withSpan } from '@/infra/utils/with-span'

export async function processBookmark(
  bookmarkId: string,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<DomainError | null> {
  return withSpan('process-bookmark', async (_span, tracer) => {
    const bookmark = await findBookmarkById(bookmarkId)
    if (!bookmark) return null

    logger.info({ bookmarkId, url: bookmark.url }, 'bookmark processing started')
    await updateBookmark(bookmarkId, { status: 'processing' })

    const rawText = await scrappingService.scrapping(bookmark.url, tracer)
    if (rawText instanceof DomainError) {
      logger.error({ bookmarkId, url: bookmark.url, error: rawText.message }, 'bookmark scraping failed')
      await updateBookmark(bookmarkId, { status: 'failed', failureReason: rawText.message })
      return rawText
    }

    const description = await summarizeService.summarize(rawText, tracer)
    if (description instanceof DomainError) {
      logger.error({ bookmarkId, error: description.message }, 'bookmark summarization failed')
      await updateBookmark(bookmarkId, { status: 'failed', failureReason: description.message })
      return description
    }

    const titleResult = await summarizeService.generateTitle(description, tracer)
    if (titleResult instanceof DomainError) {
      logger.warn({ bookmarkId, error: titleResult.message }, 'bookmark title generation failed')
    }
    const title = titleResult instanceof DomainError ? undefined : titleResult

    const tagsResult = await summarizeService.generateTags(description, tracer)
    if (tagsResult instanceof DomainError) {
      logger.warn({ bookmarkId, error: tagsResult.message }, 'bookmark tag generation failed')
    }
    const tags = tagsResult instanceof DomainError ? null : tagsResult

    const embedding = await embeddingService.generateEmbedding(description, tracer)
    if (embedding instanceof DomainError) {
      logger.error({ bookmarkId, error: embedding.message }, 'bookmark embedding failed')
      await updateBookmark(bookmarkId, { status: 'failed', failureReason: embedding.message })
      return embedding
    }

    await updateBookmark(bookmarkId, { status: 'ready', description, title, tags, embedding })
    logger.info({ bookmarkId, url: bookmark.url }, 'bookmark processing complete')
    return null
  })
}
