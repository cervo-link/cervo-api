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
import { sessionAuth } from '@/infra/http/middlewares/session-auth'

export async function apiBookmarksRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks',
    onRequest: [sessionAuth],
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
    onRequest: [sessionAuth],
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
    onRequest: [sessionAuth],
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
    onRequest: [sessionAuth],
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
    onRequest: [sessionAuth],
    schema: {
      description: 'Get a bookmark by ID',
      tags: ['bookmarks'],
      params: getBookmarkByIdParamsSchema,
      response: getBookmarkByIdResponseSchema,
    },
    handler: getBookmarkByIdController,
  })
}
