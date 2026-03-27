import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from '@/config'
import { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'
import { getBookmarks } from '@/domain/services/bookmarks/get-bookmark-service'
import { retryBookmark } from '@/domain/services/bookmarks/retry-bookmark-service'
import { getMembership } from '@/domain/services/membership/get-membership'
import { findById as findMemberById } from '@/infra/db/repositories/members-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'
import { createEmbeddingProvider } from '@/infra/factories/embedding-service-factory'
import { createScrappingService } from '@/infra/factories/scrapping-service-factory'
import { createSummarizeService } from '@/infra/factories/summarize-service-factory'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { withSpan } from '@/infra/utils/with-span'
import {
  createBookmarkBodySchemaRequest,
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
      return reply.status(404).send({ message: new WorkspaceNotFound().message })
    }

    const member = await findMemberById(memberId)
    if (!member) {
      return reply.status(404).send({ message: new MemberNotFound().message })
    }

    const membership = await getMembership(workspaceId, memberId)
    if (membership instanceof DomainError) return replyWithError(reply, membership)

    const scrappingAdapter = createScrappingService(config.firecrawl.SCRAPPING_PROVIDER)
    const embeddingAdapter = createEmbeddingProvider(config.openai.EMBEDDING_PROVIDER)
    const summarizeAdapter = createSummarizeService(config.openai.SUMMARIZE_PROVIDER)

    const result = await createBookmark(
      { workspaceId, memberId, url, source: source ?? 'web' },
      scrappingAdapter,
      embeddingAdapter,
      summarizeAdapter
    )

    if (result instanceof DomainError) return replyWithError(reply, result)

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
      return reply.status(404).send({ message: new WorkspaceNotFound().message })
    }

    const member = await findMemberById(memberId)
    if (!member) {
      return reply.status(404).send({ message: new MemberNotFound().message })
    }

    const embeddingAdapter = createEmbeddingProvider(config.openai.EMBEDDING_PROVIDER)
    const summarizeAdapter = createSummarizeService(config.openai.SUMMARIZE_PROVIDER)

    const bookmarks = await getBookmarks(
      { workspaceId, memberId, text, limit },
      embeddingAdapter,
      summarizeAdapter
    )

    if (bookmarks instanceof DomainError) return replyWithError(reply, bookmarks)

    return reply.status(200).send(bookmarks)
  })
}

export async function retryBookmarkController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('retry-bookmark', async () => {
    const { id } = retryBookmarkParamsSchema.parse(request.params)

    const scrappingAdapter = createScrappingService(config.firecrawl.SCRAPPING_PROVIDER)
    const embeddingAdapter = createEmbeddingProvider(config.openai.EMBEDDING_PROVIDER)
    const summarizeAdapter = createSummarizeService(config.openai.SUMMARIZE_PROVIDER)

    const result = await retryBookmark(id, scrappingAdapter, embeddingAdapter, summarizeAdapter)

    if (result instanceof DomainError) return replyWithError(reply, result)

    return reply.status(200).send({ message: 'Retry triggered' })
  })
}
