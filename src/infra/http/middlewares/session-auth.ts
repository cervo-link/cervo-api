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
    console.warn(`[sessionAuth] no session — ${request.method} ${request.url}`)
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid session is required.',
      statusCode: 401,
    })
  }

  console.log(`[sessionAuth] session found — userId=${session.user.id} ${request.method} ${request.url}`)

  const member = await findByUserId(session.user.id)

  if (!member) {
    console.warn(`[sessionAuth] no member for userId=${session.user.id}`)
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No member record found for this session.',
      statusCode: 401,
    })
  }

  console.log(`[sessionAuth] member resolved — memberId=${member.id}`)
  request.member = member
}
