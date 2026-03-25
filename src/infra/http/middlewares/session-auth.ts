import type { FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/infra/auth'
import { findByUserId } from '@/infra/db/repositories/members-repository'
import { logger } from '@/infra/logger'

export async function sessionAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    logger.warn({ method: request.method, url: request.url }, '[sessionAuth] no session')
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid session is required.',
      statusCode: 401,
    })
  }

  logger.info({ userId: session.user.id, method: request.method, url: request.url }, '[sessionAuth] session found')

  const member = await findByUserId(session.user.id)

  if (!member) {
    logger.warn({ userId: session.user.id }, '[sessionAuth] no member found for userId')
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No member record found for this session.',
      statusCode: 401,
    })
  }

  logger.info({ memberId: member.id }, '[sessionAuth] member resolved')
  request.member = member
}
