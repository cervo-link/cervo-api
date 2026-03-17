import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import {
  addMemberToWorkspaceController,
  createMemberController,
} from '../controllers/members-controller'
import {
  addMemberToWorkspaceBodySchemaRequest,
  addMemberToWorkspaceBodySchemaResponse,
  createMemberBodySchemaRequest,
  createMemberBodySchemaResponse,
} from '../schemas/members-schema'

export async function memberRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/create',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a member',
      tags: ['members'],
      response: createMemberBodySchemaResponse,
      body: createMemberBodySchemaRequest,
    },
    handler: createMemberController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/members/add',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Add a member to a workspace',
      tags: ['members'],
      response: addMemberToWorkspaceBodySchemaResponse,
      body: addMemberToWorkspaceBodySchemaRequest,
    },
    handler: addMemberToWorkspaceController,
  })
}
