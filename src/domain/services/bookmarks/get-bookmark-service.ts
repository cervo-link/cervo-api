import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
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
): Promise<Bookmark[] | DomainError> {
  const embedded = await embeddingService.generateEmbedding(input.text)
  if (!embedded) {
    return new FailedToGenerateEmbedding()
  }

  const bookmarks = await findBookmarks(input.workspaceId, embedded)
  if (bookmarks instanceof DomainError) {
    return bookmarks
  }

  console.log(bookmarks)

  return bookmarks
}
