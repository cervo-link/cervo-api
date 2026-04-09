import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { anyAuth } from '@/infra/http/middlewares/any-auth'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import { requireAbility } from '@/infra/http/middlewares/workspace-role-auth'
import {
  changeMemberRoleController,
  createWorkspaceController,
  deleteWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceController,
  getWorkspacesByMemberController,
  inviteMemberController,
  updateWorkspaceController,
} from '../controllers/workspace-controller'
import {
  changeMemberRoleBodySchemaRequest,
  changeMemberRoleParamsSchemaRequest,
  changeMemberRoleSchemaResponse,
  createWorkspaceBodySchemaRequest,
  createWorkspaceBodySchemaResponse,
  deleteWorkspaceParamsSchemaRequest,
  deleteWorkspaceSchemaResponse,
  getMyWorkspacesSchemaResponse,
  getWorkspaceQuerySchemaRequest,
  getWorkspaceQuerySchemaResponse,
  getWorkspacesByMemberParamsSchema,
  getWorkspacesByMemberResponseSchema,
  inviteMemberBodySchemaRequest,
  inviteMemberParamsSchemaRequest,
  inviteMemberSchemaResponse,
  updateWorkspaceBodySchemaRequest,
  updateWorkspaceParamsSchemaRequest,
  updateWorkspaceSchemaResponse,
} from '../schemas/workspaces-schema'

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
    method: 'PATCH',
    url: '/workspaces/:workspaceId',
    onRequest: [sessionAuth, requireAbility('update', 'Workspace')],
    schema: {
      description: 'Update a workspace name, description, or visibility',
      tags: ['workspaces'],
      params: updateWorkspaceParamsSchemaRequest,
      body: updateWorkspaceBodySchemaRequest,
      response: updateWorkspaceSchemaResponse,
    },
    handler: updateWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/workspaces/:workspaceId',
    onRequest: [sessionAuth, requireAbility('delete', 'Workspace')],
    schema: {
      description: 'Delete a workspace',
      tags: ['workspaces'],
      params: deleteWorkspaceParamsSchemaRequest,
      response: deleteWorkspaceSchemaResponse,
    },
    handler: deleteWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/:workspaceId/members',
    onRequest: [sessionAuth, requireAbility('manage', 'Member')],
    schema: {
      description: 'Invite a member to a workspace by email',
      tags: ['workspaces'],
      params: inviteMemberParamsSchemaRequest,
      body: inviteMemberBodySchemaRequest,
      response: inviteMemberSchemaResponse,
    },
    handler: inviteMemberController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/workspaces/:workspaceId/members/:memberId',
    onRequest: [sessionAuth, requireAbility('manage', 'Member')],
    schema: {
      description: "Change a workspace member's role",
      tags: ['workspaces'],
      params: changeMemberRoleParamsSchemaRequest,
      body: changeMemberRoleBodySchemaRequest,
      response: changeMemberRoleSchemaResponse,
    },
    handler: changeMemberRoleController,
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
    url: '/workspaces/by-member/:memberId',
    onRequest: [anyAuth(sessionAuth, apiKeyAuth)],
    schema: {
      description: 'List all workspaces a given member belongs to',
      tags: ['workspaces'],
      params: getWorkspacesByMemberParamsSchema,
      response: getWorkspacesByMemberResponseSchema,
    },
    handler: getWorkspacesByMemberController,
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
