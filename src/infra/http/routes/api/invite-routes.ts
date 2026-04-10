import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import {
  acceptInviteController,
  getInviteController,
} from '@/infra/http/controllers/invite-controller'
import {
  acceptInviteParamsSchemaRequest,
  acceptInviteSchemaResponse,
  getInviteParamsSchemaRequest,
  getInviteSchemaResponse,
} from '@/infra/http/schemas/invite-schema'

export async function apiInviteRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/invites/:token',
    schema: {
      description: 'Get invite info (public, no auth required)',
      tags: ['invites'],
      params: getInviteParamsSchemaRequest,
      response: getInviteSchemaResponse,
    },
    handler: getInviteController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/invites/:token/accept',
    onRequest: [sessionAuth],
    schema: {
      description: 'Accept an invite and join the workspace',
      tags: ['invites'],
      params: acceptInviteParamsSchemaRequest,
      response: acceptInviteSchemaResponse,
    },
    handler: acceptInviteController,
  })
}
