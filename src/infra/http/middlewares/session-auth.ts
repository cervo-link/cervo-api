import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { auth } from '@/infra/auth'
import { findByUserId } from '@/infra/db/repositories/members-repository'
import { logger } from '@/infra/logger'

export async function sessionAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>
  try {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })
  } catch {
    logger.warn(
      { method: request.method, url: request.url },
      '[sessionAuth] getSession threw'
    )
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid session is required.',
      statusCode: 401,
    })
  }

  if (!session) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid session is required.',
      statusCode: 401,
    })
  }

  const member = await findByUserId(session.user.id)

  if (!member) {
    logger.warn(
      { userId: session.user.id },
      '[sessionAuth] no member found for userId'
    )
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No member record found for this session.',
      statusCode: 401,
    })
  }

  request.member = member
}
