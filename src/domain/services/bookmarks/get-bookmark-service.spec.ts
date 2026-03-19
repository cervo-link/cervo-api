import { describe, expect, it, vi } from 'vitest'
import { makeRawEmbedding } from '@/tests/factories/make-embedding'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { getBookmarks } from './get-bookmark-service'

describe('getBookmarks', () => {
  it('should get a bookmark', async () => {
    const member = await makeMember()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, member.id)

    const bookmark = await makeBookmark({
      workspaceId: workspace.id,
      memberId: member.id,
    })

    const embeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(makeRawEmbedding()),
    }

    const bookmarks = await getBookmarks(
      { workspaceId: workspace.id, memberId: member.id, text: 'test', limit: 5 },
      embeddingService
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        visible: true,
      },
    ])
  })
})
