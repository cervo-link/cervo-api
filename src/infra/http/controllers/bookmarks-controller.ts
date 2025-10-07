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
  const { workspaceId, memberId, url } = createBookmarkBodySchemaRequest.parse(
    request.body
  )

  try {
    await getMembership(workspaceId, memberId)
  } catch (error) {
    return reply.status((error as DomainError).status).send({
      message: (error as DomainError).message,
    })
  }

  const scrappingAdapter = createScrappingService('scrapping-bee')
  const embeddingAdapter = createEmbeddingProvider('embeddinggemma')
  const summarizeAdapter = createSummarizeService('gemma')

  try {
    await createBookmark(
      {
        workspaceId,
        memberId,
        url,
      },
      scrappingAdapter,
      embeddingAdapter,
      summarizeAdapter
    )
  } catch (error) {
    return reply.status((error as DomainError).status).send({
      message: (error as DomainError).message,
    })
  }

  return reply.send({
    message: 'Bookmark created successfully',
  })
}

export async function getBookmarksController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { workspaceId, memberId, text } = getBookmarksQuerySchemaRequest.parse(
    request.query
  )

  const embeddingAdapter = createEmbeddingProvider('embeddinggemma')

  const bookmarks = await getBookmarks(
    { workspaceId, memberId, text },
    embeddingAdapter
  )

  if (bookmarks instanceof DomainError) {
    return reply.status(bookmarks.status).send({
      message: bookmarks.message,
    })
  }

  return reply.send(bookmarks)
}
