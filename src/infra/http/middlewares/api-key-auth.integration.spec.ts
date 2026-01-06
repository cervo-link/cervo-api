import type { FastifyInstance } from 'fastify'
import { fastify } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { apiKeyAuth } from './api-key-auth'

const mockApiKey = 'test-integration-api-key'
vi.mock('@/config', () => ({
  config: {
    auth: {
      API_KEY: mockApiKey,
    },
  },
}))

describe('API Key Authentication Middleware - Integration', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = fastify()

    app.get('/protected', { onRequest: [apiKeyAuth] }, async () => {
      return { message: 'Access granted' }
    })

    app.get('/public', async () => {
      return { message: 'Public access' }
    })

    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should allow access to public routes without API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public',
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Public access' })
  })

  it('should deny access to protected routes without API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected',
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Unauthorized')
  })

  it('should allow access with valid API key in Authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: `Bearer ${mockApiKey}`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Access granted' })
  })

  it('should allow access with valid API key in X-API-Key header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        'x-api-key': mockApiKey,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Access granted' })
  })

  it('should allow access with valid API key in query parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/protected?api_key=${mockApiKey}`,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Access granted' })
  })

  it('should deny access with invalid API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: 'Bearer invalid-key',
      },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Forbidden')
  })
})
