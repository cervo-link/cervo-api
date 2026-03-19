import { describe, expect, it } from 'vitest'

const API_KEY = 'test-api-key-for-testing'

import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'

describe('createMemberIdentityController', () => {
  it('should link a platform identity to a member', async () => {
    const member = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: `/members/${member.id}/identities`,
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        provider: 'discord',
        providerUserId: 'discord-user-abc',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.identity.memberId).toBe(member.id)
    expect(body.identity.provider).toBe('discord')
    expect(body.identity.providerUserId).toBe('discord-user-abc')
  })

  it('should return 404 when member does not exist', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/members/00000000-0000-0000-0000-000000000000/identities',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        provider: 'discord',
        providerUserId: 'discord-user-xyz',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
  })

  it('should return 422 when identity already exists', async () => {
    const member = await makeMember()
    await makeMemberPlatformIdentity({ memberId: member.id, provider: 'discord', providerUserId: 'discord-dup-user' })

    const response = await app.inject({
      method: 'POST',
      url: `/members/${member.id}/identities`,
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        provider: 'discord',
        providerUserId: 'discord-dup-user',
      },
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({ message: 'Platform identity already exists' })
  })
})

describe('findMemberByIdentityController', () => {
  it('should find a member by platform identity', async () => {
    const member = await makeMember()
    await makeMemberPlatformIdentity({ memberId: member.id, provider: 'discord', providerUserId: 'discord-find-user' })

    const response = await app.inject({
      method: 'GET',
      url: '/members/by-identity',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        provider: 'discord',
        providerUserId: 'discord-find-user',
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.member.id).toBe(member.id)
  })

  it('should return 404 when identity is not found', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/members/by-identity',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: {
        provider: 'discord',
        providerUserId: 'nonexistent-user',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
  })
})
