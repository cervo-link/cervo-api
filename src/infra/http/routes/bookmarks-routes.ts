import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createBookmarkController,
  getBookmarksController,
  retryBookmarkController,
} from '@/infra/http/controllers/bookmarks-controller'
import {
  createBookmarkBodySchemaRequest,
  createBookmarkBodySchemaResponse,
  getBookmarksBodySchemaResponse,
  getBookmarksQuerySchemaRequest,
  retryBookmarkParamsSchema,
  retryBookmarkResponseSchema,
} from '@/infra/http/schemas/bookmarks-schema'
import { anyAuth } from '@/infra/http/middlewares/any-auth'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'

export async function bookmarksRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Create a bookmark',
      tags: ['bookmarks'],
      response: createBookmarkBodySchemaResponse,
      body: createBookmarkBodySchemaRequest,
    },
    handler: createBookmarkController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/bookmarks',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Get all bookmarks',
      tags: ['bookmarks'],
      response: getBookmarksBodySchemaResponse,
      query: getBookmarksQuerySchemaRequest,
    },
    handler: getBookmarksController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks/:id/retry',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Retry processing a failed bookmark',
      tags: ['bookmarks'],
      params: retryBookmarkParamsSchema,
      response: retryBookmarkResponseSchema,
    },
    handler: retryBookmarkController,
  })
}
