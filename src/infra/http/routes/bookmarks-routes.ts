import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { createBookmarkController } from '@/infra/http/controllers/bookmarks-controller'
import {
  createBookmarkQuerySchema,
  createBookmarkResponseSchema,
} from '@/infra/http/schemas/bookmarks-schema'

export async function bookmarksRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/bookmarks',
    schema: {
      description: 'Create a bookmark',
      tags: ['bookmarks'],
      response: createBookmarkResponseSchema,
      body: createBookmarkQuerySchema,
    },
    handler: createBookmarkController,
  })
}
