import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createWorkspaceController,
  deleteWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceController,
} from '../controllers/workspace-controller'
import {
  createWorkspaceBodySchemaRequest,
  createWorkspaceBodySchemaResponse,
  deleteWorkspaceParamsSchemaRequest,
  deleteWorkspaceSchemaResponse,
  getMyWorkspacesSchemaResponse,
  getWorkspaceQuerySchemaRequest,
  getWorkspaceQuerySchemaResponse,
} from '../schemas/workspaces-schema'
import { anyAuth } from '@/infra/http/middlewares/any-auth'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'

export async function workspaceRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/create',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Create a workspace',
      tags: ['workspaces'],
      response: createWorkspaceBodySchemaResponse,
      body: createWorkspaceBodySchemaRequest,
    },
    handler: createWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/workspaces/:workspaceId',
    onRequest: [sessionAuth],
    schema: {
      description: 'Delete a workspace',
      tags: ['workspaces'],
      params: deleteWorkspaceParamsSchemaRequest,
      response: deleteWorkspaceSchemaResponse,
    },
    handler: deleteWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces/me',
    onRequest: [sessionAuth],
    schema: {
      description: 'List all workspaces the authenticated member belongs to',
      tags: ['workspaces'],
      response: getMyWorkspacesSchemaResponse,
    },
    handler: getMyWorkspacesController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workspaces',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'Get a workspace by platform ID',
      tags: ['workspaces'],
      response: getWorkspaceQuerySchemaResponse,
      query: getWorkspaceQuerySchemaRequest,
    },
    handler: getWorkspaceController,
  })
}
