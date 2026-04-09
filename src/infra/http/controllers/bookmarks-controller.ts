import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from '@/config'
import { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'
import { getBookmarks } from '@/domain/services/bookmarks/get-bookmark-service'
import { retryBookmark } from '@/domain/services/bookmarks/retry-bookmark-service'
import { getMembership } from '@/domain/services/membership/get-membership'
import {
  deleteBookmark,
  findBookmarkById,
} from '@/infra/db/repositories/bookmark-repository'
import { findById as findMemberById } from '@/infra/db/repositories/members-repository'
import { findMembershipRole } from '@/infra/db/repositories/membership-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'
import { createEmbeddingProvider } from '@/infra/factories/embedding-service-factory'
import { createScrappingService } from '@/infra/factories/scrapping-service-factory'
import { createSummarizeService } from '@/infra/factories/summarize-service-factory'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { logger } from '@/infra/logger'
import { withSpan } from '@/infra/utils/with-span'
import { defineAbilitiesFor } from '@/lib/abilities'
import {
  bookmarkSchema,
  createBookmarkBodySchemaRequest,
  deleteBookmarkParamsSchema,
  getBookmarkByIdParamsSchema,
  getBookmarksQuerySchemaRequest,
  retryBookmarkParamsSchema,
} from '../schemas/bookmarks-schema'

export async function createBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-bookmark', async () => {
    const { workspaceId, memberId, url, source } =
      createBookmarkBodySchemaRequest.parse(request.body)

    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) {
      return reply
        .status(404)
        .send({ message: new WorkspaceNotFound().message })
    }

    const member = await findMemberById(memberId)
    if (!member) {
      return reply.status(404).send({ message: new MemberNotFound().message })
    }

    const membership = await getMembership(workspaceId, memberId)
    if (membership instanceof DomainError)
      return replyWithError(reply, membership)

    // Enforce editor role for the acting member (applies to both session and API key auth)
    const role = await findMembershipRole(workspaceId, memberId)
    if (defineAbilitiesFor(role).cannot('manage', 'Link')) {
      return reply
        .status(403)
        .send({ message: 'Requires ability to manage Link' })
    }

    const scrappingAdapter = createScrappingService(
      config.firecrawl.SCRAPPING_PROVIDER
    )
    const embeddingAdapter = createEmbeddingProvider(
      config.openai.EMBEDDING_PROVIDER
    )
    const summarizeAdapter = createSummarizeService(
      config.openai.SUMMARIZE_PROVIDER
    )

    logger.info({ workspaceId, memberId, url, source }, 'bookmark submitted')

    const result = await createBookmark(
      { workspaceId, memberId, url, source: source ?? 'web' },
      scrappingAdapter,
      embeddingAdapter,
      summarizeAdapter
    )

    if (result instanceof DomainError) {
      logger.warn(
        { workspaceId, memberId, url, error: result.message },
        'bookmark submission failed'
      )
      return replyWithError(reply, result)
    }

    logger.info(
      { bookmarkId: result.id, workspaceId, memberId },
      'bookmark queued for processing'
    )
    return reply.status(201).send({ id: result.id, status: result.status })
  })
}

export async function getBookmarksController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-bookmarks', async () => {
    const { workspaceId, memberId, text, limit } =
      getBookmarksQuerySchemaRequest.parse(request.query)

    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) {
      return reply
        .status(404)
        .send({ message: new WorkspaceNotFound().message })
    }

    const member = await findMemberById(memberId)
    if (!member) {
      return reply.status(404).send({ message: new MemberNotFound().message })
    }

    const embeddingAdapter = createEmbeddingProvider(
      config.openai.EMBEDDING_PROVIDER
    )
    const summarizeAdapter = createSummarizeService(
      config.openai.SUMMARIZE_PROVIDER
    )

    logger.info({ workspaceId, memberId, text, limit }, 'bookmark search')

    const bookmarks = await getBookmarks(
      { workspaceId, memberId, text, limit },
      embeddingAdapter,
      summarizeAdapter
    )

    if (bookmarks instanceof DomainError)
      return replyWithError(reply, bookmarks)

    logger.info(
      { workspaceId, memberId, count: bookmarks.length },
      'bookmark search results'
    )
    return reply.status(200).send(bookmarks)
  })
}

export async function retryBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('retry-bookmark', async () => {
    const { id } = retryBookmarkParamsSchema.parse(request.params)

    const scrappingAdapter = createScrappingService(
      config.firecrawl.SCRAPPING_PROVIDER
    )
    const embeddingAdapter = createEmbeddingProvider(
      config.openai.EMBEDDING_PROVIDER
    )
    const summarizeAdapter = createSummarizeService(
      config.openai.SUMMARIZE_PROVIDER
    )

    logger.info({ bookmarkId: id }, 'bookmark retry triggered')

    const result = await retryBookmark(
      id,
      scrappingAdapter,
      embeddingAdapter,
      summarizeAdapter
    )

    if (result instanceof DomainError) {
      logger.warn(
        { bookmarkId: id, error: result.message },
        'bookmark retry failed'
      )
      return replyWithError(reply, result)
    }

    return reply.status(200).send({ message: 'Retry triggered' })
  })
}

export async function deleteBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('delete-bookmark', async () => {
    const { id } = deleteBookmarkParamsSchema.parse(request.params)

    const bookmark = await findBookmarkById(id)
    if (!bookmark) {
      return reply.status(404).send({ message: 'Bookmark not found' })
    }

    // For session-authenticated requests, enforce editor role
    if (request.member) {
      const role = await findMembershipRole(
        bookmark.workspaceId,
        request.member.id
      )
      if (defineAbilitiesFor(role).cannot('manage' as never, 'Link' as never)) {
        return reply
          .status(403)
          .send({ message: 'Requires ability to manage Link' })
      }
    }

    await deleteBookmark(id)

    return reply.status(200).send({ message: 'Bookmark deleted' })
  })
}

export async function getBookmarkByIdController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-bookmark-by-id', async () => {
    const { id } = getBookmarkByIdParamsSchema.parse(request.params)

    const bookmark = await findBookmarkById(id)
    if (!bookmark) {
      return reply.status(404).send({ message: 'Bookmark not found' })
    }

    return reply.status(200).send(bookmarkSchema.parse(bookmark))
  })
}
