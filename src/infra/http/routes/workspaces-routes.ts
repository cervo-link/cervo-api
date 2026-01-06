import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createWorkspaceController,
  getWorkspaceController,
} from '../controllers/workspace-controller'
import {
  createWorkspaceBodySchemaRequest,
  createWorkspaceBodySchemaResponse,
  getWorkspaceQuerySchemaRequest,
  getWorkspaceQuerySchemaResponse,
} from '../schemas/workspaces-schema'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'

export async function workspaceRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/create',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a workspace',
      tags: ['workspaces'],
      response: createWorkspaceBodySchemaResponse,
      body: createWorkspaceBodySchemaRequest,
    },
    handler: createWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Get a workspace by platform ID',
      tags: ['workspaces'],
      response: getWorkspaceQuerySchemaResponse,
      query: getWorkspaceQuerySchemaRequest,
    },
    handler: getWorkspaceController,
  })
}
