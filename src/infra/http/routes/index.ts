import type { FastifyInstance } from 'fastify'
import { bookmarksRoutes } from './bookmarks-routes'
import { healthcheckRoute } from './healthcheck'
import { memberRoutes } from './members-routes'
import { workspaceRoutes } from './workspaces-routes'

export function routes(server: FastifyInstance) {
  server.register(healthcheckRoute)
  server.register(bookmarksRoutes)
  server.register(workspaceRoutes)
  server.register(memberRoutes)
}
