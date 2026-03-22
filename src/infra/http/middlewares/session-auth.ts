import type { FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/infra/auth'
import { findByUserId } from '@/infra/db/repositories/members-repository'

export async function sessionAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid session is required.',
      statusCode: 401,
    })
  }

  const member = await findByUserId(session.user.id)

  if (!member) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No member record found for this session.',
      statusCode: 401,
    })
  }

  request.member = member
}
