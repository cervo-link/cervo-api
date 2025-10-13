import type { FastifyInstance } from 'fastify'
import { config } from '@/config'
import app from './app'

export async function startServer(): Promise<FastifyInstance> {
  await app.listen({
    port: Number(config.app.PORT),
    host: '0.0.0.0',
  })

  console.log(`HTTP server running at ${config.app.PORT}`)

  return app
}
