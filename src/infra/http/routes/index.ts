import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth-routes'
import { bookmarksRoutes } from './bookmarks-routes'
import { healthcheckRoute } from './healthcheck'
import { memberRoutes } from './members-routes'
import { workspaceIntegrationsRoutes } from './workspace-integrations-routes'
import { workspaceRoutes } from './workspaces-routes'

export function routes(server: FastifyInstance) {
  server.register(healthcheckRoute)
  server.register(authRoutes)
  server.register(bookmarksRoutes)
  server.register(workspaceRoutes)
  server.register(workspaceIntegrationsRoutes)
  server.register(memberRoutes)
}
