import { trace } from '@opentelemetry/api'
import type { FastifyInstance } from 'fastify'
import { config } from '@/config'
import app from './app'

export async function startServer(): Promise<FastifyInstance> {
  const tracer = trace.getTracer('server-startup')

  return tracer.startActiveSpan('start-server', async span => {
    span.setAttributes({
      'server.port': Number(config.app.PORT),
      'server.host': '0.0.0.0',
    })

    await app.listen({
      port: Number(config.app.PORT),
      host: '0.0.0.0',
    })

    console.info(`HTTP server running at ${config.app.PORT}`)

    span.setAttributes({
      'server.status': 'started',
      'server.url': `http://0.0.0.0:${config.app.PORT}`,
    })

    span.end()
    return app
  })
}
