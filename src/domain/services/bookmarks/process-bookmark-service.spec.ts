import { describe, expect, it, vi } from 'vitest'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import {
  findBookmarkById,
  insertBookmark,
} from '@/infra/db/repositories/bookmark-repository'
import { processBookmark } from './process-bookmark-service'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'

async function makeSubmittedBookmark(workspaceId: string, memberId: string) {
  const url = 'https://example.com'
  const urlHashId = await crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(url))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

  const bookmark = await insertBookmark({ workspaceId, memberId, url, urlHashId, status: 'submitted' })
  if ('message' in bookmark) throw bookmark
  return bookmark
}

describe('processBookmark', () => {
  it('should set status to ready after successful processing', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeSubmittedBookmark(workspace.id, member.id)

    const scrappingService = { scrapping: vi.fn().mockResolvedValue('scraped content') }
    const embeddingService = { generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()) }
    const summarizeService = {
      summarize: vi.fn().mockResolvedValue('summary'),
      generateTitle: vi.fn().mockResolvedValue('Title'),
      generateTags: vi.fn().mockResolvedValue(['tag1', 'tag2']),
      explain: vi.fn(),
    }

    await processBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('ready')
    expect(updated?.description).toBe('summary')
    expect(updated?.title).toBe('Title')
    expect(updated?.tags).toEqual(['tag1', 'tag2'])
  })

  it('should set status to failed when scrapping fails', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeSubmittedBookmark(workspace.id, member.id)

    const scrappingService = { scrapping: vi.fn().mockResolvedValue(new FailedToScrap()) }
    const embeddingService = { generateEmbedding: vi.fn() }
    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi.fn(),
    }

    await processBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('failed')
    expect(updated?.failureReason).toBeDefined()
  })

  it('should set status to failed when summarize fails', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeSubmittedBookmark(workspace.id, member.id)

    const scrappingService = { scrapping: vi.fn().mockResolvedValue('content') }
    const embeddingService = { generateEmbedding: vi.fn() }
    const summarizeService = {
      summarize: vi.fn().mockResolvedValue(new FailedToSummarize()),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi.fn(),
    }

    await processBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('failed')
  })

  it('should set status to failed when embedding fails', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeSubmittedBookmark(workspace.id, member.id)

    const scrappingService = { scrapping: vi.fn().mockResolvedValue('content') }
    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(new FailedToGenerateEmbedding()),
    }
    const summarizeService = {
      summarize: vi.fn().mockResolvedValue('summary'),
      generateTitle: vi.fn().mockResolvedValue('Title'),
      generateTags: vi.fn().mockResolvedValue(['tag1']),
      explain: vi.fn(),
    }

    await processBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('failed')
  })

  it('should still complete when generateTags fails (non-critical)', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)
    const bookmark = await makeSubmittedBookmark(workspace.id, member.id)

    const scrappingService = { scrapping: vi.fn().mockResolvedValue('content') }
    const embeddingService = { generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()) }
    const summarizeService = {
      summarize: vi.fn().mockResolvedValue('summary'),
      generateTitle: vi.fn().mockResolvedValue('Title'),
      generateTags: vi.fn().mockResolvedValue(new FailedToSummarize()),
      explain: vi.fn(),
    }

    await processBookmark(bookmark.id, scrappingService, embeddingService, summarizeService)

    const updated = await findBookmarkById(bookmark.id)
    expect(updated?.status).toBe('ready')
    expect(updated?.tags).toBeNull()
  })

  it('should do nothing when bookmark does not exist', async () => {
    const scrappingService = { scrapping: vi.fn() }
    const embeddingService = { generateEmbedding: vi.fn() }
    const summarizeService = { summarize: vi.fn(), generateTitle: vi.fn(), generateTags: vi.fn(), explain: vi.fn() }

    await expect(
      processBookmark('00000000-0000-0000-0000-000000000000', scrappingService, embeddingService, summarizeService)
    ).resolves.not.toThrow()

    expect(scrappingService.scrapping).not.toHaveBeenCalled()
  })
})
