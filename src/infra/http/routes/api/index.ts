import type { FastifyInstance } from 'fastify'
import { apiBookmarksRoutes } from './bookmarks-routes'
import { apiInviteRoutes } from './invite-routes'
import { apiMembersRoutes } from './members-routes'
import { apiWorkspaceIntegrationsRoutes } from './workspace-integrations-routes'
import { apiWorkspacesRoutes } from './workspaces-routes'

export function apiRoutes(app: FastifyInstance) {
  app.register(apiBookmarksRoutes)
  app.register(apiWorkspacesRoutes)
  app.register(apiWorkspaceIntegrationsRoutes)
  app.register(apiMembersRoutes)
  app.register(apiInviteRoutes)
}
