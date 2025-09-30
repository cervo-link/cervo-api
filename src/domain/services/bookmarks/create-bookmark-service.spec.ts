import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { createBookmark } from './create-bookmark-service'

describe('createBookmark', () => {
  it('should create a bookmark', async () => {
    const fakeId = faker.string.uuid()

    const scrappingService = {
      scrapping: async () => {
        return 'test'
      },
    }

    const embeddingService = {
      generateEmbedding: async () => {
        return [1, 2, 3]
      },
    }

    const result = await createBookmark(
      {
        workspaceId: fakeId,
        memberId: fakeId,
        url: 'https://www.google.com',
      },
      scrappingService,
      embeddingService
    )

    expect(result).toBe('test')
  })
})
