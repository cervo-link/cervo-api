import type { FastifyInstance } from 'fastify'
import { healthcheckRoute } from './healthcheck'

export function routes(server: FastifyInstance) {
  server.register(healthcheckRoute)
}
