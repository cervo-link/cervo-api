import { fastify } from 'fastify'
import { config } from '@/config'
import { createBookmark } from '@/domain/services/bookmarks/create-bookmark-service'

export function startServer() {
  const app = fastify()

  app.get('/', async (_, reply) => {
    const response = await createBookmark({
      workspaceId: '123',
      memberId: '123',
      url: 'https://skiper-ui.com/',
    })

    return reply.send(response)
  })

  app
    .listen({
      port: config.app.PORT,
      host: '0.0.0.0',
    })
    .then(() => {
      console.log(`HTTP server running at ${config.app.PORT}`)
    })
}
