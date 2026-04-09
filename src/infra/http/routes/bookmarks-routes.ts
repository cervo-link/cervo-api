import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createBookmarkController,
  deleteBookmarkController,
  getBookmarkByIdController,
  getBookmarksController,
  retryBookmarkController,
} from '@/infra/http/controllers/bookmarks-controller'
import {
  createBookmarkBodySchemaRequest,
  createBookmarkBodySchemaResponse,
  deleteBookmarkParamsSchema,
  deleteBookmarkResponseSchema,
  getBookmarkByIdParamsSchema,
  getBookmarkByIdResponseSchema,
  getBookmarksBodySchemaResponse,
  getBookmarksQuerySchemaRequest,
  retryBookmarkParamsSchema,
  retryBookmarkResponseSchema,
} from '@/infra/http/schemas/bookmarks-schema'
import { anyAuth } from '@/infra/http/middlewares/any-auth'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'

// TODO(tech-debt): bookmark routes use anyAuth(sessionAuth, apiKeyAuth) which forces
// role enforcement to be conditional inside the controller rather than declarative
// middleware. Separate session-only routes from API-key-only routes (e.g. a /bot prefix)
// so that role guards can be applied uniformly via requireAbility middleware.
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/bookmarks/:id',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Delete a bookmark',
      tags: ['bookmarks'],
      params: deleteBookmarkParamsSchema,
      response: deleteBookmarkResponseSchema,
    },
    handler: deleteBookmarkController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/bookmarks/:id',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Get a bookmark by ID',
      tags: ['bookmarks'],
      params: getBookmarkByIdParamsSchema,
      response: getBookmarkByIdResponseSchema,
    },
    handler: getBookmarkByIdController,
  })
}
