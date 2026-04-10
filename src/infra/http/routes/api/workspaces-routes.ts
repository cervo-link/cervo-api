import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import { requireAbility } from '@/infra/http/middlewares/workspace-role-auth'
import {
  changeMemberRoleController,
  createWorkspaceController,
  deleteWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceController,
  inviteMemberController,
  listWorkspaceMembersController,
  removeMemberController,
  updateWorkspaceController,
} from '@/infra/http/controllers/workspace-controller'
import { createInviteController } from '@/infra/http/controllers/invite-controller'
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
  inviteMemberBodySchemaRequest,
  inviteMemberParamsSchemaRequest,
  inviteMemberSchemaResponse,
  listMembersParamsSchemaRequest,
  listMembersSchemaResponse,
  removeMemberParamsSchemaRequest,
  removeMemberSchemaResponse,
  updateWorkspaceBodySchemaRequest,
  updateWorkspaceParamsSchemaRequest,
  updateWorkspaceSchemaResponse,
} from '@/infra/http/schemas/workspaces-schema'
import {
  createInviteBodySchemaRequest,
  createInviteParamsSchemaRequest,
  createInviteSchemaResponse,
} from '@/infra/http/schemas/invite-schema'

export async function apiWorkspacesRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workspaces/create',
    onRequest: [sessionAuth],
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
    onRequest: [sessionAuth],
    schema: {
      description: 'Get a workspace by ID',
      tags: ['workspaces'],
      response: getWorkspaceQuerySchemaResponse,
      query: getWorkspaceQuerySchemaRequest,
    },
    handler: getWorkspaceController,
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
    method: 'GET',
    url: '/workspaces/:workspaceId/members',
    onRequest: [sessionAuth, requireAbility('read', 'Workspace')],
    schema: {
      description: 'List all members of a workspace',
      tags: ['workspaces'],
      params: listMembersParamsSchemaRequest,
      response: listMembersSchemaResponse,
    },
    handler: listWorkspaceMembersController,
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
    method: 'DELETE',
    url: '/workspaces/:workspaceId/members/:memberId',
    onRequest: [sessionAuth, requireAbility('manage', 'Member')],
    schema: {
      description: 'Remove a member from a workspace',
      tags: ['workspaces'],
      params: removeMemberParamsSchemaRequest,
      response: removeMemberSchemaResponse,
    },
    handler: removeMemberController,
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
    method: 'POST',
    url: '/workspaces/:workspaceId/invites',
    onRequest: [sessionAuth, requireAbility('manage', 'Member')],
    schema: {
      description: 'Create an invite link for a workspace',
      tags: ['invites'],
      params: createInviteParamsSchemaRequest,
      body: createInviteBodySchemaRequest,
      response: createInviteSchemaResponse,
    },
    handler: createInviteController,
  })
}
