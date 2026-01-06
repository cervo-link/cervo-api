import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import app from '@/infra/http/app'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const API_KEY = 'test-api-key-for-testing'

describe('MembersController', () => {
  it('should be able to create a member', async () => {
    const member = makeRawMember()

    const payload = {
      name: member.name,
      username: member.username,
      email: member.email,
      discordUserId: member.discordUserId,
      password: 'some-password',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      member: {
        id: expect.any(String),
        name: member.name,
        username: member.username,
        email: member.email,
        discordUserId: member.discordUserId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        active: true,
      },
    })
  })

  it('should be able to return error when password is not provided', async () => {
    const member = makeRawMember()

    const payload = {
      name: member.name,
      username: member.username,
      email: member.email,
      discordUserId: member.discordUserId,
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      message: 'body/password Password must be a valid string',
    })
  })

  it('should be able to return error username already exists', async () => {
    const member = makeRawMember()

    await makeMember({ username: member.username })

    const payload = {
      name: member.name,
      username: member.username,
      email: member.email,
      discordUserId: member.discordUserId,
      password: 'some-password',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Cannot create duplicated member',
    })
  })

  it('should be able to return error email already exists', async () => {
    const member = makeRawMember()

    await makeMember({ email: member.email })

    const payload = {
      name: member.name,
      username: member.username,
      email: member.email,
      discordUserId: member.discordUserId,
      password: 'some-password',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: {
        authorization: `Bearer ${API_KEY}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Cannot create duplicated member',
    })
  })

  describe('PUT /members/add', () => {
    it('should be able to add a member to a workspace', async () => {
      const member = await makeMember()
      const workspace = await makeWorkspace()

      const payload = {
        memberId: member.id,
        workspaceId: workspace.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Member invited to workspace.',
      })
    })

    it('should return 404 when workspace does not exist', async () => {
      const member = await makeMember()
      const nonExistentWorkspaceId = faker.string.uuid()

      const payload = {
        memberId: member.id,
        workspaceId: nonExistentWorkspaceId,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Workspace not found',
      })
    })

    it('should return 404 when member does not exist', async () => {
      const workspace = await makeWorkspace()
      const nonExistentMemberId = faker.string.uuid()

      const payload = {
        memberId: nonExistentMemberId,
        workspaceId: workspace.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Member not found',
      })
    })

    it('should return 422 when membership already exists', async () => {
      const member = await makeMember()
      const workspace = await makeWorkspace()
      await makeMembership(workspace.id, member.id)

      const payload = {
        memberId: member.id,
        workspaceId: workspace.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(422)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Cannot create membership because it already exists',
      })
    })

    it('should return 400 when memberId is not provided', async () => {
      const workspace = await makeWorkspace()

      const payload = {
        workspaceId: workspace.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        message: 'body/memberId Member ID must be a valid string',
      })
    })

    it('should return 400 when workspaceId is not provided', async () => {
      const member = await makeMember()

      const payload = {
        memberId: member.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        message: 'body/workspaceId Workspace ID must be a valid string',
      })
    })

    it('should return 401 when API key is not provided', async () => {
      const member = await makeMember()
      const workspace = await makeWorkspace()

      const payload = {
        memberId: member.id,
        workspaceId: workspace.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        payload,
      })

      expect(response.statusCode).toBe(401)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unauthorized',
        message: expect.stringContaining('API key is required'),
        statusCode: 401,
      })
    })
  })
})
