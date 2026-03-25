import type { FastifyInstance } from 'fastify'
import { config } from '@/config'
import app from './app'

export async function startServer(): Promise<FastifyInstance> {
  await app.listen({
    port: Number(config.app.PORT),
    host: '0.0.0.0',
  })

  app.log.info({ port: config.app.PORT }, 'HTTP server running')

  return app
}
