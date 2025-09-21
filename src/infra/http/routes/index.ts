import type { FastifyInstance } from 'fastify'
import { bookmarksRoutes } from './bookmarks-routes'
import { healthcheckRoute } from './healthcheck'

export function routes(server: FastifyInstance) {
  server.register(healthcheckRoute)
  server.register(bookmarksRoutes)
}
