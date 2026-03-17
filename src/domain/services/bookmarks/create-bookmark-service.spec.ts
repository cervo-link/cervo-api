import { describe, expect, it } from 'vitest'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { createBookmark } from './create-bookmark-service'

describe('createBookmark', () => {
  it('should create a bookmark', async () => {
    const { id: workspaceId } = await makeWorkspace()
    const { id: memberId } = await makeMember()
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
      generateTitle: async () => {
        return 'Test Title'
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
  })
})
