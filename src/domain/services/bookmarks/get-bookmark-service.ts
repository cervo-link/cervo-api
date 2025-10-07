import type { Bookmark } from '@/domain/entities/bookmark'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
import { FailedToGetBookmarks } from '@/domain/errors/failed-to-get-bookmarks'
import { findBookmarks } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'

export type GetBookmarksInput = {
  workspaceId: string
  memberId: string
  text: string
}

export async function getBookmarks(
  input: GetBookmarksInput,
  embeddingService: EmbeddingService
): Promise<Bookmark[]> {
  const embedded = await embeddingService.generateEmbedding(input.text)
  if (!embedded) {
    throw new FailedToGenerateEmbedding()
  }

  const bookmarks = await findBookmarks(input.workspaceId, embedded)

  if (!bookmarks) {
    throw new FailedToGetBookmarks()
  }

  return bookmarks
}
