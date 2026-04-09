import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  addWorkspaceIntegrationController,
  deleteWorkspaceIntegrationController,
  getWorkspaceIntegrationsController,
} from '@/infra/http/controllers/workspace-integrations-controller'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import { requireAbility } from '@/infra/http/middlewares/workspace-role-auth'
import {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  addWorkspaceIntegrationResponseSchema,
  deleteWorkspaceIntegrationParamsSchema,
  deleteWorkspaceIntegrationResponseSchema,
  getWorkspaceIntegrationsParamsSchema,
  getWorkspaceIntegrationsResponseSchema,
} from '@/infra/http/schemas/workspace-integrations-schema'

export async function apiWorkspaceIntegrationsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces/:workspaceId/integrations',
    onRequest: [sessionAuth, requireAbility('read', 'Workspace')],
    schema: {
      description: 'List integrations for a workspace',
      tags: ['workspace-integrations'],
      params: getWorkspaceIntegrationsParamsSchema,
      response: getWorkspaceIntegrationsResponseSchema,
    },
    handler: getWorkspaceIntegrationsController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/:workspaceId/integrations',
    onRequest: [sessionAuth, requireAbility('manage', 'Workspace')],
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
    method: 'DELETE',
    url: '/workspaces/:workspaceId/integrations/:integrationId',
    onRequest: [sessionAuth, requireAbility('manage', 'Workspace')],
    schema: {
      description: 'Remove a platform integration from a workspace',
      tags: ['workspace-integrations'],
      params: deleteWorkspaceIntegrationParamsSchema,
      response: deleteWorkspaceIntegrationResponseSchema,
    },
    handler: deleteWorkspaceIntegrationController,
  })
}
