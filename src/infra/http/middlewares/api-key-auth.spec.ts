import type { FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiKeyAuth } from './api-key-auth'

vi.mock('@/config', () => ({
  config: {
    auth: {
      API_KEY: 'test-valid-api-key',
    },
  },
}))

describe('API Key Authentication Middleware', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let replySendMock: ReturnType<typeof vi.fn>
  let replyCodeMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    replySendMock = vi.fn()
    replyCodeMock = vi.fn().mockReturnValue({ send: replySendMock })

    mockRequest = {
      headers: {},
      query: {},
    }

    mockReply = {
      code: replyCodeMock,
    } as Partial<FastifyReply>
  })

  it('should accept valid API key from Authorization header', async () => {
    mockRequest.headers = {
      authorization: 'Bearer test-valid-api-key',
    }

    const result = await apiKeyAuth(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(result).toBeUndefined()
    expect(replyCodeMock).not.toHaveBeenCalled()
  })

  it('should accept valid API key from X-API-Key header', async () => {
    mockRequest.headers = {
      'x-api-key': 'test-valid-api-key',
    }

    const result = await apiKeyAuth(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(result).toBeUndefined()
    expect(replyCodeMock).not.toHaveBeenCalled()
  })

  it('should accept valid API key from query parameter', async () => {
    mockRequest.query = {
      api_key: 'test-valid-api-key',
    }

    const result = await apiKeyAuth(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(result).toBeUndefined()
    expect(replyCodeMock).not.toHaveBeenCalled()
  })

  it('should reject request with missing API key', async () => {
    await apiKeyAuth(mockRequest as FastifyRequest, mockReply as FastifyReply)

    expect(replyCodeMock).toHaveBeenCalledWith(401)
    expect(replySendMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: expect.stringContaining('API key is required'),
      statusCode: 401,
    })
  })

  it('should reject request with invalid API key', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-api-key',
    }

    await apiKeyAuth(mockRequest as FastifyRequest, mockReply as FastifyReply)

    expect(replyCodeMock).toHaveBeenCalledWith(403)
    expect(replySendMock).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Invalid API key',
      statusCode: 403,
    })
  })

  it('should prioritize Authorization header over other sources', async () => {
    mockRequest.headers = {
      authorization: 'Bearer test-valid-api-key',
      'x-api-key': 'different-key',
    }
    mockRequest.query = {
      api_key: 'another-key',
    }

    const result = await apiKeyAuth(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(result).toBeUndefined()
    expect(replyCodeMock).not.toHaveBeenCalled()
  })

  it('should handle array value in X-API-Key header', async () => {
    mockRequest.headers = {
      'x-api-key': ['test-valid-api-key', 'another-key'] as unknown as string,
    }

    const result = await apiKeyAuth(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(result).toBeUndefined()
    expect(replyCodeMock).not.toHaveBeenCalled()
  })

  it('should reject malformed Authorization header', async () => {
    mockRequest.headers = {
      authorization: 'Basic test-valid-api-key',
    }

    await apiKeyAuth(mockRequest as FastifyRequest, mockReply as FastifyReply)

    expect(replyCodeMock).toHaveBeenCalledWith(401)
  })
})
