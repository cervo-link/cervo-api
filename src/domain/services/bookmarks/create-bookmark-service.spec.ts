import { describe, expect, it, vi } from 'vitest'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { createBookmark } from './create-bookmark-service'

const scrappingService = { scrapping: vi.fn().mockResolvedValue('content') }
const embeddingService = { generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()) }
const summarizeService = {
  summarize: vi.fn().mockResolvedValue('summary'),
  generateTitle: vi.fn().mockResolvedValue('Title'),
  generateTags: vi.fn().mockResolvedValue(['tag1']),
}

describe('createBookmark', () => {
  it('should return a bookmark with status submitted immediately', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const result = await createBookmark(
      { workspaceId: workspace.id, memberId: member.id, url: 'https://example.com' },
      scrappingService,
      embeddingService,
      summarizeService
    )

    expect(result).not.toBeInstanceOf(Error)
    if (!('message' in result)) {
      expect(result.status).toBe('submitted')
      expect(result.url).toBe('https://example.com')
    }
  })

  it('should return the bookmark before processing completes', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const slowScrapping = {
      scrapping: vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow content'), 5000))
      ),
    }

    const result = await createBookmark(
      { workspaceId: workspace.id, memberId: member.id, url: 'https://example.com/slow' },
      slowScrapping,
      embeddingService,
      summarizeService
    )

    expect(result).not.toBeInstanceOf(Error)
    if (!('message' in result)) {
      expect(result.status).toBe('submitted')
    }
  })
})
