import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { createWorkspaceController } from '../controllers/workspace-controller'
import {
  createWorkspaceBodySchemaRequest,
  createWorkspaceBodySchemaResponse,
} from '../schemas/workspaces-schema'

export async function workspaceRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/create',
    schema: {
      description: 'Create a workspace',
      tags: ['workspaces'],
      response: createWorkspaceBodySchemaResponse,
      body: createWorkspaceBodySchemaRequest,
    },
    handler: createWorkspaceController,
  })
}
