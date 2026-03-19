import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyAccessToken } from '@/infra/utils/jwt'

export async function jwtAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.substring(7)
  try {
    const { memberId } = await verifyAccessToken(token)
    request.user = { memberId }
  } catch {
    return reply.code(401).send({ message: 'Invalid or expired token' })
  }
}
