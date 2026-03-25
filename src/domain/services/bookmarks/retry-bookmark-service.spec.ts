import { describe, expect, it, vi } from 'vitest'
import { BookmarkNotFound } from '@/domain/errors/bookmark-not-found'
import { BookmarkNotInFailedState } from '@/domain/errors/bookmark-not-in-failed-state'
import { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarkById,
} from '@/infra/db/repositories/bookmark-repository'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { retryBookmark } from './retry-bookmark-service'

function makeMockServices() {
  return {
    scrappingService: { scrapping: vi.fn().mockResolvedValue('scraped content') },
    embeddingService: { generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()) },
    summarizeService: {
      summarize: vi.fn().mockResolvedValue('summary'),
      generateTitle: vi.fn().mockResolvedValue('Title'),
      generateTags: vi.fn().mockResolvedValue(['tag1']),
      explain: vi.fn(),
    },
  }
}

describe('retryBookmark', () => {
  it('should return BookmarkNotFound when bookmark does not exist', async () => {
    const { scrappingService, embeddingService, summarizeService } = makeMockServices()

    const result = await retryBookmark(
      '00000000-0000-0000-0000-000000000000',
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).toBeInstanceOf(BookmarkNotFound)
  })

  it('should return BookmarkNotInFailedState when bookmark is in submitted state', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: member.id, status: 'submitted' })
    const { scrappingService, embeddingService, summarizeService } = makeMockServices()

    const result = await retryBookmark(
      bookmark.id,
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).toBeInstanceOf(BookmarkNotInFailedState)
  })

  it('should return BookmarkNotInFailedState when bookmark is in ready state', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({ workspaceId: workspace.id, memberId: member.id, status: 'ready' })
    const { scrappingService, embeddingService, summarizeService } = makeMockServices()

    const result = await retryBookmark(
      bookmark.id,
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).toBeInstanceOf(BookmarkNotInFailedState)
  })

  it('should reset status to submitted and return null for a failed bookmark', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      status: 'failed',
      failureReason: 'scraping failed',
    })
    const { scrappingService, embeddingService, summarizeService } = makeMockServices()

    const result = await retryBookmark(
      bookmark.id,
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).toBeNull()
    expect(result).not.toBeInstanceOf(DomainError)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('submitted')
    expect(updated?.failureReason).toBeNull()
  })

  it('should trigger processing so the bookmark becomes ready', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      status: 'failed',
      failureReason: 'scraping failed',
    })
    const { scrappingService, embeddingService, summarizeService } = makeMockServices()

    await retryBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    // Let the setImmediate fire
    await new Promise(resolve => setImmediate(resolve))

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('ready')
  })
})
