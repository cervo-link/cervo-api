import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  addWorkspaceIntegrationController,
  getWorkspaceByIntegrationController,
} from '@/infra/http/controllers/workspace-integrations-controller'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  addWorkspaceIntegrationResponseSchema,
  getWorkspaceByIntegrationQuerySchema,
  getWorkspaceByIntegrationResponseSchema,
} from '@/infra/http/schemas/workspace-integrations-schema'

export async function workspaceIntegrationsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/:workspaceId/integrations',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Add a platform integration to a workspace',
      tags: ['workspace-integrations'],
      params: addWorkspaceIntegrationParamsSchema,
      body: addWorkspaceIntegrationBodySchema,
      response: addWorkspaceIntegrationResponseSchema,
    },
    handler: addWorkspaceIntegrationController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces/by-integration',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Find a workspace by its platform integration (bot-facing)',
      tags: ['workspace-integrations'],
      query: getWorkspaceByIntegrationQuerySchema,
      response: getWorkspaceByIntegrationResponseSchema,
    },
    handler: getWorkspaceByIntegrationController,
  })
}
