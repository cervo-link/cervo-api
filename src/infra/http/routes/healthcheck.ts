import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const healthcheckRoute: FastifyPluginAsyncZod = async server => {
  server.get(
    '/health',
    {
      config: { rateLimit: false },
      schema: {
        tags: ['service'],
        operationId: 'healthcheck',
        description: 'Check if the system is up and running',
        response: {
          200: z.object({
            message: z.literal('ok'),
          }),
        },
      },
    },
    async () => {
      return {
        message: 'ok' as const,
      }
    }
  )
}
