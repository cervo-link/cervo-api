import { beforeEach, describe, expect, it, vi } from 'vitest'

const API_KEY = 'test-api-key-for-testing'

import app from '@/infra/http/app'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const mockScrappingService = { scrapping: vi.fn() }
const mockEmbeddingService = { generateEmbedding: vi.fn() }
const mockSummarizeService = { summarize: vi.fn(), generateTitle: vi.fn(), generateTags: vi.fn(), explain: vi.fn() }

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
    mockSummarizeService.generateTitle.mockResolvedValue('Test Title')
    mockSummarizeService.generateTags.mockResolvedValue(['tag1', 'tag2'])
  })

  it('should be able to create a bookmark', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.id).toBeDefined()
    expect(body.status).toBe('submitted')
  })

  it('should be able to return error when workspace does not exist', async () => {
    const member = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        workspaceId: '00000000-0000-0000-0000-000000000000',
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
  })

  it('should be able to return error when member does not exist', async () => {
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        workspaceId: workspace.id,
        memberId: '00000000-0000-0000-0000-000000000000',
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
  })

  it('should be able to return error when membership does not exist', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        workspaceId: workspace.id,
        memberId: member.id,
        url: 'https://www.google.com',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Membership not found' })
  })

  it('should be able to return error when url is not valid', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
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

})

describe('getBookmarksController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
    mockSummarizeService.explain.mockResolvedValue(['Because it matches the test query'])
  })

  it('should be able to get bookmarks', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'test',
      },
    })

    expect(response.statusCode).toBe(200)
    const responseBody = JSON.parse(response.body)[0]
    expect(responseBody).toEqual({
      id: bookmark.id,
      workspaceId: workspace.id,
      memberId: member.id,
      url: bookmark.url,
      urlHashId: bookmark.urlHashId,
      status: bookmark.status,
      title: bookmark.title,
      description: bookmark.description,
      tags: bookmark.tags,
      failureReason: bookmark.failureReason,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
      visible: bookmark.visible,
      matchedBecause: 'Because it matches the test query',
    })
  })

  it('should return empty array when no bookmarks found', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const response = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'something that will not match',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([])
  })
})

describe('retryBookmarkController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScrappingService.scrapping.mockResolvedValue('test content')
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
    mockSummarizeService.summarize.mockResolvedValue('test summary')
    mockSummarizeService.generateTitle.mockResolvedValue('Test Title')
    mockSummarizeService.generateTags.mockResolvedValue(['tag1', 'tag2'])
  })

  it('should trigger retry for a failed bookmark', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      status: 'failed',
    })

    const response = await app.inject({
      method: 'POST',
      url: `/bookmarks/${bookmark.id}/retry`,
      headers: { authorization: `Bearer ${API_KEY}` },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Retry triggered' })
  })

  it('should return 409 when bookmark is not in failed state', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      status: 'ready',
    })

    const response = await app.inject({
      method: 'POST',
      url: `/bookmarks/${bookmark.id}/retry`,
      headers: { authorization: `Bearer ${API_KEY}` },
    })

    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark is not in failed state' })
  })

  it('should return 404 for unknown bookmark', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookmarks/00000000-0000-0000-0000-000000000000/retry',
      headers: { authorization: `Bearer ${API_KEY}` },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark not found' })
  })
})
