import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'
import { getMembership } from '@/domain/services/membership/get-membership'
import { createEmbeddingProvider } from '@/infra/factories/embedding-service-factory'
import { createScrappingService } from '@/infra/factories/scrapping-service-factory'
import { createBookmarkBodySchemaRequest } from '../schemas/bookmarks-schema'

export async function createBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { workspaceId, memberId, url } = createBookmarkBodySchemaRequest.parse(
    request.body
  )

  const membership = await getMembership(workspaceId, memberId)
  if (membership instanceof DomainError) {
    return reply.status(membership.status).send({
      message: membership.message,
    })
  }

  const scrappingAdapter = createScrappingService('scrapping-bee')
  const embeddingAdapter = createEmbeddingProvider('embeddinggemma')

  const response = await createBookmark(
    {
      workspaceId,
      memberId,
      url,
    },
    scrappingAdapter,
    embeddingAdapter
  )

  if (response instanceof DomainError) {
    return reply.status(response.status).send({
      message: response.message,
    })
  }

  return reply.send(response)
}
