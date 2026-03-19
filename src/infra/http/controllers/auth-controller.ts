import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { requestMagicLink } from '@/domain/services/auth/request-magic-link-service'
import { refreshAccessToken } from '@/domain/services/auth/refresh-token-service'
import { revokeToken } from '@/domain/services/auth/revoke-token-service'
import { verifyMagicLink } from '@/domain/services/auth/verify-magic-link-service'
import { createEmailService } from '@/infra/factories/email-service-factory'
import type {
  logoutBodySchema,
  refreshTokenBodySchema,
  requestMagicLinkBodySchema,
  verifyMagicLinkBodySchema,
} from '@/infra/http/schemas/auth-schema'

export async function requestMagicLinkController(
  request: FastifyRequest<{ Body: z.infer<typeof requestMagicLinkBodySchema> }>,
  reply: FastifyReply
) {
  const { email } = request.body
  const emailService = createEmailService()
  await requestMagicLink(email, emailService)
  return reply.code(200).send({ message: 'Magic link sent' })
}

export async function verifyMagicLinkController(
  request: FastifyRequest<{ Body: z.infer<typeof verifyMagicLinkBodySchema> }>,
  reply: FastifyReply
) {
  const { token } = request.body
  const result = await verifyMagicLink(token)
  if (result instanceof DomainError) {
    return reply.code(result.status).send({ message: result.message })
  }
  return reply.code(200).send(result)
}

export async function refreshTokenController(
  request: FastifyRequest<{ Body: z.infer<typeof refreshTokenBodySchema> }>,
  reply: FastifyReply
) {
  const { refreshToken } = request.body
  const result = await refreshAccessToken(refreshToken)
  if (result instanceof DomainError) {
    return reply.code(result.status).send({ message: result.message })
  }
  return reply.code(200).send(result)
}

export async function logoutController(
  request: FastifyRequest<{ Body: z.infer<typeof logoutBodySchema> }>,
  reply: FastifyReply
) {
  const { refreshToken } = request.body
  const result = await revokeToken(refreshToken)
  if (result instanceof DomainError) {
    return reply.code(result.status).send({ message: result.message })
  }
  return reply.code(200).send({ message: 'Logged out' })
}
