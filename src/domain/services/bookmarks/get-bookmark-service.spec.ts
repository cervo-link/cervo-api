import { describe, expect, it, vi } from 'vitest'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { getBookmarks } from './get-bookmark-service'

describe('getBookmarks', () => {
  it('should get bookmarks with explanations', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const embedding = makeRawEmbedding()
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      embedding,
    })

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
    }

    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi
        .fn()
        .mockResolvedValue(['Relevant because it matches the query']),
    }

    const bookmarks = await getBookmarks(
      {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'test',
        limit: 5,
      },
      embeddingService,
      summarizeService
    )

    expect(bookmarks).toEqual([
      {
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        visible: true,
        matchedBecause: 'Relevant because it matches the query',
      },
    ])
  })

  it('should return bookmarks without matchedBecause when explain fails', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const embedding = makeRawEmbedding()
    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      embedding,
    })

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
    }

    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi
        .fn()
        .mockResolvedValue(new FailedToSummarize('Explain failed')),
    }

    const bookmarks = await getBookmarks(
      {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'test',
        limit: 5,
      },
      embeddingService,
      summarizeService
    )

    expect(bookmarks).toEqual([
      expect.objectContaining({
        id: bookmark.id,
        matchedBecause: undefined,
      }),
    ])
  })

  it('should return empty array when no bookmarks found', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()),
    }

    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi.fn(),
    }

    const result = await getBookmarks(
      {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'no match',
        limit: 5,
      },
      embeddingService,
      summarizeService
    )

    expect(result).toEqual([])
    expect(summarizeService.explain).not.toHaveBeenCalled()
  })

  it('should return bookmarks from all member workspaces when workspace is personal', async () => {
    const member = await makeMember()

    const personalWorkspace = await makeWorkspace({ isPersonal: true, ownerId: member.id })
    await makeMembership(personalWorkspace.id, member.id)

    const otherWorkspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(otherWorkspace.id, member.id)

    const embedding = makeRawEmbedding()

    const bookmarkInPersonal = await makeBookmark({
      workspaceId: personalWorkspace.id,
      memberId: member.id,
      embedding,
    })
    const bookmarkInOther = await makeBookmark({
      workspaceId: otherWorkspace.id,
      memberId: member.id,
      embedding,
    })

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
    }
    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi.fn().mockResolvedValue([]),
    }

    const bookmarks = await getBookmarks(
      {
        workspaceId: personalWorkspace.id,
        memberId: member.id,
        text: 'test',
        limit: 10,
      },
      embeddingService,
      summarizeService
    )

    const ids = (bookmarks as { id: string }[]).map(b => b.id)
    expect(ids).toContain(bookmarkInPersonal.id)
    expect(ids).toContain(bookmarkInOther.id)
  })

  it('should not return bookmarks from other workspaces when workspace is not personal', async () => {
    const member = await makeMember()

    const workspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(workspace.id, member.id)

    const otherWorkspace = await makeWorkspace({ ownerId: member.id })
    await makeMembership(otherWorkspace.id, member.id)

    const embedding = makeRawEmbedding()

    await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
      embedding,
    })
    const bookmarkInOther = await makeBookmark({
      workspaceId: otherWorkspace.id,
      memberId: member.id,
      embedding,
    })

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
    }
    const summarizeService = {
      summarize: vi.fn(),
      generateTitle: vi.fn(),
      generateTags: vi.fn(),
      explain: vi.fn().mockResolvedValue([]),
    }

    const bookmarks = await getBookmarks(
      {
        workspaceId: workspace.id,
        memberId: member.id,
        text: 'test',
        limit: 10,
      },
      embeddingService,
      summarizeService
    )

    const ids = (bookmarks as { id: string }[]).map(b => b.id)
    expect(ids).not.toContain(bookmarkInOther.id)
  })
})
