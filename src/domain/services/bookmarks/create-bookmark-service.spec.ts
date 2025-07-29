import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { MembershipNotFound } from '@/domain/errors/membership-not-found'
import { createBookmark } from './create-bookmark-service'

describe('createBookmark', () => {
  it('should not be able to create a bookmark when the member is not a member of the workspace', async () => {
    const fakeId = faker.string.uuid()

    const result = await createBookmark({
      workspaceId: fakeId,
      memberId: fakeId,
      url: 'https://www.google.com',
    })

    expect(result).toBeInstanceOf(MembershipNotFound)
  })
})
