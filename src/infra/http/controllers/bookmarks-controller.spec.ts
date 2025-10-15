import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import app from '@/infra/http/app'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const mockScrappingService = {
  scrapping: vi.fn(),
}

const mockEmbeddingService = {
  generateEmbedding: vi.fn(),
}

const mockSummarizeService = {
  summarize: vi.fn(),
}

vi.mock('@/infra/factories/scrapping-service-factory', () => ({
  createScrappingService: () => mockScrappingService,
}))

vi.mock('@/infra/factories/embedding-service-factory', () => ({
  createEmbeddingProvider: () => mockEmbeddingService,
}))

vi.mock('@/infra/factories/summarize-service-factory', () => ({
  createSummarizeService: () => mockSummarizeService,
}))

describe('BookmarksController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScrappingService.scrapping.mockResolvedValue('test content')
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
    mockSummarizeService.summarize.mockResolvedValue('test summary')
  })

  it('should be able to create a bookmark', async () => {
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

  it('should be able to return error when membership does not exist', async () => {
    const member = await makeMember()
    const workspaceId = randomUUID()

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: {
        workspaceId,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Membership not found',
    })
  })

  it('should be able to return error when url is not valid', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'invalid-url-',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'body/url URL must be a valid URL',
    })
  })

  it('should be able to return error when scrapping fails', async () => {
    mockScrappingService.scrapping.mockResolvedValue(new FailedToScrap())

    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Failed to scrap',
    })
  })

  it('should be able to return error when summarize fails', async () => {
    mockSummarizeService.summarize.mockResolvedValue(new FailedToSummarize())

    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Failed to summarize content',
    })
  })

  it('should be able to return error when generate embedding fails', async () => {
    mockEmbeddingService.generateEmbedding.mockResolvedValue(
      new FailedToGenerateEmbedding()
    )

    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Failed to generate embedding',
    })
  })
})
