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

export async function bookmarksRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks',
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
    schema: {
      description: 'Get all bookmarks',
      tags: ['bookmarks'],
      response: getBookmarksBodySchemaResponse,
      query: getBookmarksQuerySchemaRequest,
    },
    handler: getBookmarksController,
  })
}
