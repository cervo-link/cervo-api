import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import {
  createWorkspaceController,
  getWorkspacesByMemberController,
} from '@/infra/http/controllers/workspace-controller'
import {
  createWorkspaceBodySchemaRequest,
  createWorkspaceBodySchemaResponse,
  getWorkspacesByMemberParamsSchema,
  getWorkspacesByMemberResponseSchema,
} from '@/infra/http/schemas/workspaces-schema'

export async function integrationsWorkspacesRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/create',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a workspace',
      tags: ['integrations-workspaces'],
      response: createWorkspaceBodySchemaResponse,
      body: createWorkspaceBodySchemaRequest,
    },
    handler: createWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces/by-member/:memberId',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'List all workspaces a given member belongs to',
      tags: ['integrations-workspaces'],
      params: getWorkspacesByMemberParamsSchema,
      response: getWorkspacesByMemberResponseSchema,
    },
    handler: getWorkspacesByMemberController,
  })
}
