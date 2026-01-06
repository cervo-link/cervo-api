import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from '@/config'

export async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = extractApiKey(request)

  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message:
        'API key is required. Provide it via Authorization header, X-API-Key header, or api_key query parameter.',
      statusCode: 401,
    })
  }

  if (apiKey !== config.auth.API_KEY) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Invalid API key',
      statusCode: 403,
    })
  }
}

function extractApiKey(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const apiKeyHeader = request.headers['x-api-key']
  if (apiKeyHeader) {
    return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader
  }

  const query = request.query as Record<string, unknown>
  if (query.api_key && typeof query.api_key === 'string') {
    return query.api_key
  }

  return null
}
