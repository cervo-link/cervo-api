import { describe, expect, it, vi } from 'vitest'
import app from '@/infra/http/app'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

describe('BookmarksController', () => {
  it('should be able to create a bookmark', async () => {
    vi.mock('@/infra/factories/scrapping-service-factory', () => ({
      createScrappingService: () => ({
        scrapping: vi.fn().mockResolvedValue('test content'),
      }),
    }))

    vi.mock('@/infra/factories/embedding-service-factory', () => ({
      createEmbeddingProvider: () => ({
        generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()),
      }),
    }))

    vi.mock('@/infra/factories/summarize-service-factory', () => ({
      createSummarizeService: () => ({
        summarize: vi.fn().mockResolvedValue('test summary'),
      }),
    }))

    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const payload = {
      workspaceId: workspace.id,
      memberId: member.id,
      url: 'https://www.google.com',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Bookmark created successfully',
    })
  })
})
