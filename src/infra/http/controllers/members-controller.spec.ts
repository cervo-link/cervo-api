import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer } from '@/infra/http/server'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'

describe('MembersController', () => {
  let server: FastifyInstance
  beforeAll(async () => {
    server = startServer()

    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('should be able to create a member', async () => {
    const member = makeRawMember()

    const payload = {
      name: member.name,
      username: member.username,
      email: member.email,
      discordUserId: member.discordUserId,
      password: 'some-password',
    }

    const response = await server.inject({
      method: 'POST',
      url: '/members/create',
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

    const response = await server.inject({
      method: 'POST',
      url: '/members/create',
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

    const response = await server.inject({
      method: 'POST',
      url: '/members/create',
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

    const response = await server.inject({
      method: 'POST',
      url: '/members/create',
      payload,
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Cannot create duplicated member',
    })
  })
})
