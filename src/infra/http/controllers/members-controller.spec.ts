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
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      member: {
        id: expect.any(String),
        name: member.name,
        username: member.username,
        email: member.email,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        active: true,
      },
    })
  })

  it('should be able to return error username already exists', async () => {
    const member = await makeMember()

    const payload = {
      name: faker.person.fullName(),
      username: member.username,
      email: faker.internet.email(),
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload,
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Cannot create duplicated member',
    })
  })

  it('should be able to return error email already exists', async () => {
    const member = await makeMember()

    const payload = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: member.email,
    }

    const response = await app.inject({
      method: 'POST',
      url: '/members/create',
      headers: { authorization: `Bearer ${API_KEY}` },
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

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { memberId: member.id, workspaceId: workspace.id },
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Member invited to workspace.',
      })
    })

    it('should return 404 when workspace does not exist', async () => {
      const member = await makeMember()

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { memberId: member.id, workspaceId: faker.string.uuid() },
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
    })

    it('should return 404 when member does not exist', async () => {
      const workspace = await makeWorkspace()

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { memberId: faker.string.uuid(), workspaceId: workspace.id },
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
    })

    it('should return 422 when membership already exists', async () => {
      const member = await makeMember()
      const workspace = await makeWorkspace()
      await makeMembership(workspace.id, member.id)

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { memberId: member.id, workspaceId: workspace.id },
      })

      expect(response.statusCode).toBe(422)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Cannot create membership because it already exists',
      })
    })

    it('should return 400 when memberId is not provided', async () => {
      const workspace = await makeWorkspace()

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { workspaceId: workspace.id },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when workspaceId is not provided', async () => {
      const member = await makeMember()

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload: { memberId: member.id },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 401 when API key is not provided', async () => {
      const member = await makeMember()
      const workspace = await makeWorkspace()

      const response = await app.inject({
        method: 'PUT',
        url: '/members/add',
        payload: { memberId: member.id, workspaceId: workspace.id },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
