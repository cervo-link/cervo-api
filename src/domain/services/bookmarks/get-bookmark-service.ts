import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarks,
  findBookmarksAcrossWorkspaces,
} from '@/infra/db/repositories/bookmark-repository'
import { findByMemberId, findById } from '@/infra/db/repositories/workspaces-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { SummarizeService } from '@/infra/ports/summarize'
import { withSpan } from '@/infra/utils/with-span'

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
  return withSpan('get-bookmarks-service', async (_span, tracer) => {
    const embedded = await embeddingService.generateEmbedding(input.text, tracer)
    if (embedded instanceof DomainError) {
      return embedded
    }

    const workspace = await findById(input.workspaceId)

    let bookmarks: Omit<Bookmark, 'embedding'>[]
    if (workspace?.isPersonal) {
      const memberWorkspaces = await findByMemberId(input.memberId)
      const workspaceIds = memberWorkspaces.map(w => w.id)
      bookmarks = await findBookmarksAcrossWorkspaces(workspaceIds, embedded, input.limit)
    } else {
      bookmarks = await findBookmarks(input.workspaceId, embedded, input.limit)
    }

    if (bookmarks.length === 0) {
      return []
    }

    const summaries = bookmarks.map(b => b.description ?? b.url)
    const explanations = await summarizeService.explain(input.text, summaries, tracer)

    const results: BookmarkWithExplanation[] = bookmarks.map((b, i) => ({
      ...b,
      matchedBecause:
        explanations instanceof DomainError ? undefined : explanations[i],
    }))

    return results
  })
}
