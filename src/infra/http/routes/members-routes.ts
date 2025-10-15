import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  addMemberToWorkspaceController,
  createMemberController,
} from '../controllers/members-controller'
import {
  createMemberBodySchemaRequest,
  createMemberBodySchemaResponse,
} from '../schemas/members-schema'

export async function memberRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/create',
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
    schema: {
      description: 'Add a member to a workspace',
      tags: ['members'],
      response: createMemberBodySchemaResponse,
      body: createMemberBodySchemaRequest,
    },
    handler: addMemberToWorkspaceController,
  })
}
