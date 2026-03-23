import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { joinWaitingListController } from '@/infra/http/controllers/waiting-list-controller'
import {
  joinWaitingListBodySchemaRequest,
  joinWaitingListBodySchemaResponse,
} from '@/infra/http/schemas/waiting-list-schema'

export async function waitingListRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/waiting-list',
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
      },
    },
    schema: {
      description: 'Join the waiting list',
      tags: ['waiting-list'],
      body: joinWaitingListBodySchemaRequest,
      response: joinWaitingListBodySchemaResponse,
    },
    handler: joinWaitingListController,
  })
}
