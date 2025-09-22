import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { createBookmark } from './create-bookmark-service'

describe('createBookmark', () => {
  it('should create a bookmark', async () => {
    const fakeId = faker.string.uuid()

    const mockAdapter = {
      scrapping: async () => {
        return 'test'
      },
    }

    const result = await createBookmark(
      {
        workspaceId: fakeId,
        memberId: fakeId,
        url: 'https://www.google.com',
      },
      mockAdapter
    )

    expect(result).toBe('test')
  })
})
