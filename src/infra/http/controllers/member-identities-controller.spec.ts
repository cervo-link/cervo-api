import { faker } from '@faker-js/faker'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '@/domain/entities/member'
import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'

const API_KEY = 'test-api-key-for-testing'

let currentMember: Member | null = null

vi.mock('@/infra/http/middlewares/session-auth', () => ({
  sessionAuth: vi.fn(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!currentMember) {
      return reply.code(401).send({ message: 'Valid session is required.' })
    }
    request.member = currentMember
  }),
}))

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

describe('POST /members/me/identities', () => {
  it('should link a new identity to the authenticated member', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: '/members/me/identities',
      payload: { provider: 'discord', providerUserId: `me-new-${Date.now()}` },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.identity.memberId).toBe(currentMember.id)
    expect(body.identity.provider).toBe('discord')
  })

  it('should return 409 when identity is already linked to this member', async () => {
    const member = await makeMember()
    currentMember = member
    const providerUserId = `me-dup-${Date.now()}`
    await makeMemberPlatformIdentity({ memberId: member.id, provider: 'discord', providerUserId })

    const response = await app.inject({
      method: 'POST',
      url: '/members/me/identities',
      payload: { provider: 'discord', providerUserId },
    })

    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body)).toEqual({
      message: 'This identity is already linked to your account',
    })
  })

  it('should return 422 when identity is linked to a different real member', async () => {
    const real = await makeMember()
    const other = await makeMember({ userId: faker.string.uuid() })
    const providerUserId = `me-other-real-${Date.now()}`
    await makeMemberPlatformIdentity({ memberId: other.id, provider: 'discord', providerUserId })
    currentMember = real

    const response = await app.inject({
      method: 'POST',
      url: '/members/me/identities',
      payload: { provider: 'discord', providerUserId },
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'This identity is already linked to a different account',
    })
  })

  it('should merge shadow member and return 201 when identity belongs to a shadow', async () => {
    const real = await makeMember()
    const shadow = await makeMember({ email: null, username: null, userId: null })
    const providerUserId = `me-shadow-${Date.now()}`
    await makeMemberPlatformIdentity({ memberId: shadow.id, provider: 'discord', providerUserId })
    currentMember = real

    const response = await app.inject({
      method: 'POST',
      url: '/members/me/identities',
      payload: { provider: 'discord', providerUserId },
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body).identity.memberId).toBe(real.id)
  })

  it('should return 401 when not authenticated', async () => {
    currentMember = null

    const response = await app.inject({
      method: 'POST',
      url: '/members/me/identities',
      payload: { provider: 'discord', providerUserId: 'any-user' },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('GET /members/me/identities', () => {
  it('should return all identities linked to the authenticated member', async () => {
    const member = await makeMember()
    await makeMemberPlatformIdentity({ memberId: member.id, provider: 'discord' })
    await makeMemberPlatformIdentity({ memberId: member.id, provider: 'github' })
    currentMember = member

    const response = await app.inject({
      method: 'GET',
      url: '/members/me/identities',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.identities).toHaveLength(2)
    expect(body.identities.map((i: { provider: string }) => i.provider)).toEqual(
      expect.arrayContaining(['discord', 'github'])
    )
  })

  it('should return empty array when member has no linked identities', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'GET',
      url: '/members/me/identities',
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).identities).toEqual([])
  })

  it('should return 401 when not authenticated', async () => {
    currentMember = null

    const response = await app.inject({
      method: 'GET',
      url: '/members/me/identities',
    })

    expect(response.statusCode).toBe(401)
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
