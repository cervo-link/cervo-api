import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createBookmarkController,
  getBookmarksController,
} from '@/infra/http/controllers/bookmarks-controller'
import {
  createBookmarkBodySchemaRequest,
  createBookmarkBodySchemaResponse,
  getBookmarksBodySchemaResponse,
  getBookmarksQuerySchemaRequest,
} from '@/infra/http/schemas/bookmarks-schema'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'

export async function integrationsBookmarksRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a bookmark',
      tags: ['integrations-bookmarks'],
      response: createBookmarkBodySchemaResponse,
      body: createBookmarkBodySchemaRequest,
    },
    handler: createBookmarkController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/bookmarks',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Get all bookmarks',
      tags: ['integrations-bookmarks'],
      response: getBookmarksBodySchemaResponse,
      query: getBookmarksQuerySchemaRequest,
    },
    handler: getBookmarksController,
  })
}
