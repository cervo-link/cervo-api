import { trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'
import { getBookmarks } from '@/domain/services/bookmarks/get-bookmark-service'
import { getMembership } from '@/domain/services/membership/get-membership'
import { createEmbeddingProvider } from '@/infra/factories/embedding-service-factory'
import { createScrappingService } from '@/infra/factories/scrapping-service-factory'
import { createSummarizeService } from '@/infra/factories/summarize-service-factory'
import {
  createBookmarkBodySchemaRequest,
  getBookmarksQuerySchemaRequest,
} from '../schemas/bookmarks-schema'

export async function createBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('create-bookmark')

  return tracer.startActiveSpan('create-bookmark-controller', async span => {
    const { workspaceId, memberId, url } =
      createBookmarkBodySchemaRequest.parse(request.body)

    const membership = await getMembership(workspaceId, memberId)

    if (membership instanceof DomainError) {
      span.end()
      return reply.status(membership.status).send({
        message: membership.message,
      })
    }

    const scrappingAdapter = createScrappingService('scrapping-bee')
    const embeddingAdapter = createEmbeddingProvider('embeddinggemma')
    const summarizeAdapter = createSummarizeService('gemma')

    const result = await createBookmark(
      {
        workspaceId,
        memberId,
        url,
      },
      scrappingAdapter,
      embeddingAdapter,
      summarizeAdapter
    )

    if (result instanceof DomainError) {
      span.end()
      return reply.status(result.status).send({
        message: result.message,
      })
    }

    span.end()
    return reply.status(201).send({
      message: 'Bookmark created successfully',
    })
  })
}

export async function getBookmarksController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('get-bookmarks')

  return tracer.startActiveSpan('get-bookmarks-controller', async span => {
    const { workspaceId, memberId, text } =
      getBookmarksQuerySchemaRequest.parse(request.query)

    const embeddingAdapter = createEmbeddingProvider('embeddinggemma')

    const bookmarks = await getBookmarks(
      { workspaceId, memberId, text },
      embeddingAdapter
    )

    if (bookmarks instanceof DomainError) {
      span.end()
      return reply.status(bookmarks.status).send({
        message: bookmarks.message,
      })
    }

    span.end()
    return reply.status(200).send(bookmarks)
  })
}
