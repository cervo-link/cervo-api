import type { FastifyInstance } from 'fastify'
import { auth } from '@/infra/auth'

export async function authRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`)

      const headers = new Headers()
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.append(key, value.toString())
      }

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })

      const response = await auth.handler(req)

      reply.status(response.status)
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })
      reply.send(response.body ? await response.text() : null)
    },
  })
}
