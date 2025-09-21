import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'
import { getMembership } from '@/domain/services/membership/get-membership'
import { createBookmarkQuerySchema } from '../schemas/bookmarks-schema'

export async function createBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { workspaceId, memberId, url } = createBookmarkQuerySchema.parse(
    request.body
  )

  const membership = await getMembership(workspaceId, memberId)
  if (membership instanceof DomainError) {
    return reply.status(membership.status).send({
      message: membership.message,
    })
  }

  // https://www.linkedin.com/posts/gabrielbernardo_boasorte-activity-7354553926672596992-ac55?utm_source=share&utm_medium=member_desktop&rcm=ACoAACGmL48BNUSqSc0TqiVt8xnUEwJrLHC-HF8'
  const response = await createBookmark({
    workspaceId,
    memberId,
    url,
  })

  if (response instanceof DomainError) {
    return reply.status(response.status).send({
      message: response.message,
    })
  }

  return reply.send(response)
}
