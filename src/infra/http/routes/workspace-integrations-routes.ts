import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  addWorkspaceIntegrationController,
  deleteIntegrationByProviderController,
  deleteWorkspaceIntegrationController,
  getWorkspaceByIntegrationController,
  getWorkspaceIntegrationsController,
  patchIntegrationByProviderController,
} from '@/infra/http/controllers/workspace-integrations-controller'
import { anyAuth } from '@/infra/http/middlewares/any-auth'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  addWorkspaceIntegrationResponseSchema,
  deleteIntegrationByProviderQuerySchema,
  deleteIntegrationByProviderResponseSchema,
  deleteWorkspaceIntegrationParamsSchema,
  deleteWorkspaceIntegrationResponseSchema,
  getWorkspaceByIntegrationQuerySchema,
  getWorkspaceByIntegrationResponseSchema,
  getWorkspaceIntegrationsParamsSchema,
  getWorkspaceIntegrationsResponseSchema,
  patchIntegrationByProviderBodySchema,
  patchIntegrationByProviderQuerySchema,
  patchIntegrationByProviderResponseSchema,
} from '@/infra/http/schemas/workspace-integrations-schema'

export async function workspaceIntegrationsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/:workspaceId/integrations',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
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
    url: '/workspaces/:workspaceId/integrations',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'List integrations for a workspace',
      tags: ['workspace-integrations'],
      params: getWorkspaceIntegrationsParamsSchema,
      response: getWorkspaceIntegrationsResponseSchema,
    },
    handler: getWorkspaceIntegrationsController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/workspaces/:workspaceId/integrations/:integrationId',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Remove a platform integration from a workspace',
      tags: ['workspace-integrations'],
      params: deleteWorkspaceIntegrationParamsSchema,
      response: deleteWorkspaceIntegrationResponseSchema,
    },
    handler: deleteWorkspaceIntegrationController,
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/workspaces/by-integration',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Update integration metadata by provider ID (bot-facing)',
      tags: ['workspace-integrations'],
      query: patchIntegrationByProviderQuerySchema,
      body: patchIntegrationByProviderBodySchema,
      response: patchIntegrationByProviderResponseSchema,
    },
    handler: patchIntegrationByProviderController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/workspaces/by-integration',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Remove an integration by provider ID (bot-facing)',
      tags: ['workspace-integrations'],
      query: deleteIntegrationByProviderQuerySchema,
      response: deleteIntegrationByProviderResponseSchema,
    },
    handler: deleteIntegrationByProviderController,
  })
}
