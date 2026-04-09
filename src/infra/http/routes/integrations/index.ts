import type { FastifyInstance } from 'fastify'
import { integrationsBookmarksRoutes } from './bookmarks-routes'
import { integrationsMembersRoutes } from './members-routes'
import { integrationsWorkspaceIntegrationsRoutes } from './workspace-integrations-routes'
import { integrationsWorkspacesRoutes } from './workspaces-routes'

export function integrationsRoutes(app: FastifyInstance) {
  app.register(integrationsBookmarksRoutes)
  app.register(integrationsWorkspacesRoutes)
  app.register(integrationsWorkspaceIntegrationsRoutes)
  app.register(integrationsMembersRoutes)
}
