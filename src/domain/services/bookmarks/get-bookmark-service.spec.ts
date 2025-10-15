import { describe, expect, it } from 'vitest'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { createBookmark } from './create-bookmark-service'
import { getBookmarks } from './get-bookmark-service'

describe('getBookmark', () => {
  it('should get a bookmark', async () => {
    const { id: memberId } = await makeMember()
    const { id: workspaceId } = await makeWorkspace()
    await makeMembership(workspaceId, memberId)

    const embedding = makeRawEmbedding()

    const scrappingService = {
      scrapping: async () => {
        return 'test'
      },
    }

    const embeddingService = {
      generateEmbedding: async () => {
        return embedding
      },
    }

    const summarizeService = {
      summarize: async () => {
        return 'test'
      },
    }

    const url = 'https://www.google.com'
    const result = await createBookmark(
      {
        workspaceId,
        memberId,
        url,
      },
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).toBe(url)

    const bookmarks = await getBookmarks(
      {
        workspaceId,
        memberId,
        text: 'test',
      },
      embeddingService
    )

    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0].url).toBe(url)
    expect(bookmarks[0].workspaceId).toBe(workspaceId)
    expect(bookmarks[0].memberId).toBe(memberId)
  })
})
