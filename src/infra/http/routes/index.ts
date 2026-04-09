import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth-routes'
import { healthcheckRoute } from './healthcheck'
import { waitingListRoutes } from './waiting-list-routes'
import { apiRoutes } from './api'
import { integrationsRoutes } from './integrations'

export function routes(server: FastifyInstance) {
  server.register(healthcheckRoute)
  server.register(authRoutes)
  server.register(waitingListRoutes)
  server.register(apiRoutes, { prefix: '/api/v1' })
  server.register(integrationsRoutes, { prefix: '/integrations/v1' })
}
