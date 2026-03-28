import type { FastifyInstance } from 'fastify'
import { config } from '@/config'
import app from './app'

export async function startServer(): Promise<FastifyInstance> {
  app.log.level = 'warn'
  await app.listen({ port: Number(config.app.PORT), host: '0.0.0.0' })
  app.log.level = 'info'
  app.log.info(`HTTP server running on port ${config.app.PORT}`)

  return app
}
