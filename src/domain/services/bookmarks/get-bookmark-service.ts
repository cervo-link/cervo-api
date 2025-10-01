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
) {
  const embedded = await embeddingService.generateEmbedding(input.text)
  if (!embedded) {
    return new FailedToGenerateEmbedding()
  }

  return await findBookmarks(input.workspaceId, embedded)
}
