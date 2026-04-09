import { beforeEach, describe, expect, it, vi } from 'vitest'

const API_KEY = 'test-api-key-for-testing'

import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Member } from '@/domain/entities/member'
import app from '@/infra/http/app'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

// When set, sessionAuth succeeds and marks request.member (simulates a logged-in session).
// When undefined, sessionAuth sends 401.
let currentMember: Member | undefined

vi.mock('@/infra/http/middlewares/session-auth', () => ({
  sessionAuth: vi.fn(async (request: FastifyRequest, reply: FastifyReply) => {
    if (currentMember) {
      request.member = currentMember
    } else {
      reply.code(401).send({ message: 'Unauthorized' })
    }
  }),
}))

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
    currentMember = undefined
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
    await makeMembership(workspace.id, member.id, 'editor')

    const response = await app.inject({
      method: 'POST',
      url: '/integrations/v1/bookmarks',
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
      url: '/integrations/v1/bookmarks',
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
      url: '/integrations/v1/bookmarks',
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
      url: '/integrations/v1/bookmarks',
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
      url: '/integrations/v1/bookmarks',
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

let getBookmarksEmbedding: number[]

describe('getBookmarksController', () => {
  beforeEach(() => {
    currentMember = undefined
    vi.clearAllMocks()
    getBookmarksEmbedding = makeRawEmbedding()
    mockEmbeddingService.generateEmbedding.mockResolvedValue(getBookmarksEmbedding)
    mockSummarizeService.explain.mockResolvedValue(['Because it matches the test query'])
  })

  it('should be able to get bookmarks', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      embedding: getBookmarksEmbedding,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/integrations/v1/bookmarks',
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
      source: bookmark.source,
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
      url: '/integrations/v1/bookmarks',
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

  it('should return 404 when workspace does not exist', async () => {
    const member = await makeMember()

    const response = await app.inject({
      method: 'GET',
      url: '/integrations/v1/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        workspaceId: '00000000-0000-0000-0000-000000000000',
        memberId: member.id,
        text: 'test',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
  })

  it('should return 404 when member does not exist', async () => {
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'GET',
      url: '/integrations/v1/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        workspaceId: workspace.id,
        memberId: '00000000-0000-0000-0000-000000000000',
        text: 'test',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
  })

  it('should return error when embedding service fails', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    mockEmbeddingService.generateEmbedding.mockResolvedValue(
      new (await import('@/domain/errors/failed-to-generate-embedding')).FailedToGenerateEmbedding()
    )

    const response = await app.inject({
      method: 'GET',
      url: '/integrations/v1/bookmarks',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'test',
      },
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('retryBookmarkController', () => {
  beforeEach(() => {
    currentMember = undefined
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
    currentMember = member

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/bookmarks/${bookmark.id}/retry`,
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
    currentMember = member

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/bookmarks/${bookmark.id}/retry`,
    })

    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark is not in failed state' })
  })

  it('should return 404 for unknown bookmark', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookmarks/00000000-0000-0000-0000-000000000000/retry',
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark not found' })
  })
})

describe('deleteBookmarkController', () => {
  it('should delete an existing bookmark', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id, 'editor')
    const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: member.id })
    currentMember = member

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookmarks/${bookmark.id}`,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark deleted' })
  })

  it('should return 404 when bookmark does not exist', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/bookmarks/00000000-0000-0000-0000-000000000000',
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark not found' })
  })
})

describe('getBookmarkByIdController', () => {
  it('should return a bookmark by id', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: member.id })
    currentMember = member

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/bookmarks/${bookmark.id}`,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.id).toBe(bookmark.id)
    expect(body.url).toBe(bookmark.url)
    expect(body.workspaceId).toBe(workspace.id)
    expect(body.memberId).toBe(member.id)
  })

  it('should return 404 when bookmark does not exist', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/bookmarks/00000000-0000-0000-0000-000000000000',
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Bookmark not found' })
  })
})

describe('Bookmark role-based access control', () => {
  beforeEach(() => {
    currentMember = undefined
    vi.clearAllMocks()
    mockScrappingService.scrapping.mockResolvedValue('test content')
    mockEmbeddingService.generateEmbedding.mockResolvedValue(makeRawEmbedding())
    mockSummarizeService.summarize.mockResolvedValue('test summary')
    mockSummarizeService.generateTitle.mockResolvedValue('Test Title')
    mockSummarizeService.generateTags.mockResolvedValue(['tag1', 'tag2'])
  })

  describe('POST /api/v1/bookmarks (session)', () => {
    it('editor can save a link via session', async () => {
      const owner = await makeMember()
      const editor = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, editor.id, 'editor')
      currentMember = editor

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookmarks',
        payload: { workspaceId: workspace.id, memberId: editor.id, url: 'https://example.com' },
      })

      expect(response.statusCode).toBe(201)
    })

    it('viewer cannot save a link via session', async () => {
      const owner = await makeMember()
      const viewer = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, viewer.id, 'viewer')
      currentMember = viewer

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookmarks',
        payload: { workspaceId: workspace.id, memberId: viewer.id, url: 'https://example.com' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('owner can save a link via session', async () => {
      const owner = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, owner.id, 'owner')
      currentMember = owner

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookmarks',
        payload: { workspaceId: workspace.id, memberId: owner.id, url: 'https://example.com' },
      })

      expect(response.statusCode).toBe(201)
    })
  })

  describe('POST /integrations/v1/bookmarks (API key / Discord bot)', () => {
    it('editor can save a link via API key', async () => {
      const owner = await makeMember()
      const editor = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, editor.id, 'editor')

      const response = await app.inject({
        method: 'POST',
        url: '/integrations/v1/bookmarks',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { workspaceId: workspace.id, memberId: editor.id, url: 'https://example.com' },
      })

      expect(response.statusCode).toBe(201)
    })

    it('viewer cannot save a link via API key', async () => {
      const owner = await makeMember()
      const viewer = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, viewer.id, 'viewer')

      const response = await app.inject({
        method: 'POST',
        url: '/integrations/v1/bookmarks',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { workspaceId: workspace.id, memberId: viewer.id, url: 'https://example.com' },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/v1/bookmarks/:id', () => {
    it('editor can delete a link via session', async () => {
      const owner = await makeMember()
      const editor = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, editor.id, 'editor')
      const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: editor.id })
      currentMember = editor

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/bookmarks/${bookmark.id}`,
      })

      expect(response.statusCode).toBe(200)
    })

    it('viewer cannot delete a link via session', async () => {
      const owner = await makeMember()
      const viewer = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, viewer.id, 'viewer')
      const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: owner.id })
      currentMember = viewer

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/bookmarks/${bookmark.id}`,
      })

      expect(response.statusCode).toBe(403)
    })

    it('viewer can list links via session (GET is always allowed)', async () => {
      const owner = await makeMember()
      const viewer = await makeMember()
      const workspace = await makeWorkspace({ ownerId: owner.id })
      await makeMembership(workspace.id, viewer.id, 'viewer')
      currentMember = viewer

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/bookmarks',
        query: { workspaceId: workspace.id, memberId: viewer.id, text: 'test' },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
