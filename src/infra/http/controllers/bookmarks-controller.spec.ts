import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const uniqueId = () => randomUUID()
const API_KEY = 'test-api-key-for-testing'

import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import app from '@/infra/http/app'
import { makeBookmark } from '@/tests/factories/make-bookmark'
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

describe('createBookmarkController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScrappingService.scrapping.mockResolvedValue('test content')
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
    mockSummarizeService.summarize.mockResolvedValue('test summary')
  })

  it('should be able to create a bookmark with discord platform', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const payload = {
      platformId: workspace.platformId,
      platform: workspace.platform,
      discordId: member.discordUserId,
      url: 'https://www.google.com',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Bookmark created successfully',
    })
  })

  it('should be able to create a bookmark with non-discord platform using userId', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({
      platform: 'slack',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const payload = {
      platformId: workspace.platformId,
      platform: workspace.platform,
      userId: member.id,
      url: 'https://www.google.com',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Bookmark created successfully',
    })
  })

  it('should be able to return error when workspace does not exist', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: 'non-existent-platform-id',
        platform: 'discord',
        discordId: member.discordUserId,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Workspace not found',
    })
  })

  it('should be able to return error when member does not exist', async () => {
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: uniqueId(),
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Member not found',
    })
  })

  it('should be able to return error when membership does not exist', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: member.discordUserId,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Membership not found',
    })
  })

  it('should be able to return error when url is not valid', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: member.discordUserId,
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

    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: member.discordUserId,
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

    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: member.discordUserId,
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

    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload: {
        platformId: workspace.platformId,
        platform: workspace.platform,
        discordId: member.discordUserId,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Failed to generate embedding',
    })
  })
})

describe('getBookmarksController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
  })

  it('should be able to get bookmarks with discord platform', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
    })

    const payload = {
      platformId: workspace.platformId,
      platform: workspace.platform,
      discordId: member.discordUserId || '',
      text: 'test',
    }

    const response = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      query: payload,
    })

    expect(response.statusCode).toBe(200)
    const responseBody = JSON.parse(response.body)[0]
    expect(responseBody).toEqual({
      id: bookmark.id,
      workspaceId: workspace.id,
      memberId: member.id,
      url: bookmark.url,
      urlHashId: bookmark.urlHashId,
      title: bookmark.title,
      description: bookmark.description,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
      visible: bookmark.visible,
    })
  })

  it('should be able to get bookmarks with non-discord platform using userId', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({
      platform: 'slack',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
    })

    const payload = {
      platformId: workspace.platformId,
      platform: workspace.platform,
      userId: member.id,
      text: 'test',
    }

    const response = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      query: payload,
    })

    expect(response.statusCode).toBe(200)
    const responseBody = JSON.parse(response.body)[0]
    expect(responseBody).toEqual({
      id: bookmark.id,
      workspaceId: workspace.id,
      memberId: member.id,
      url: bookmark.url,
      urlHashId: bookmark.urlHashId,
      title: bookmark.title,
      description: bookmark.description,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
      visible: bookmark.visible,
    })
  })

  it('should be able to return empty array when no bookmarks are found', async () => {
    const member = await makeMember({ discordUserId: uniqueId() })
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: uniqueId(),
    })
    await makeMembership(workspace.id, member.id)

    const payload = {
      platformId: workspace.platformId,
      platform: workspace.platform,
      discordId: member.discordUserId || '',
      text: 'invalid text',
    }

    const response = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      query: payload,
    })

    expect(response.statusCode).toBe(200)
    const responseBody = JSON.parse(response.body)
    expect(responseBody).toEqual([])
  })
})
