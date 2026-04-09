import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import {
  createMemberIdentityController,
  findMemberByIdentityController,
} from '@/infra/http/controllers/member-identities-controller'
import {
  addMemberToWorkspaceController,
  createMemberController,
  resolveMemberController,
} from '@/infra/http/controllers/members-controller'
import {
  addMemberToWorkspaceBodySchemaRequest,
  addMemberToWorkspaceBodySchemaResponse,
  createMemberBodySchemaRequest,
  createMemberBodySchemaResponse,
  createMemberIdentityBodySchema,
  createMemberIdentityParamsSchema,
  createMemberIdentityResponseSchema,
  findMemberByIdentityQuerySchema,
  findMemberByIdentityResponseSchema,
  resolveMemberBodySchema,
  resolveMemberResponseSchema,
} from '@/infra/http/schemas/members-schema'

export async function integrationsMembersRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/resolve',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Resolve or create a shadow member by provider identity (idempotent)',
      tags: ['integrations-members'],
      body: resolveMemberBodySchema,
      response: resolveMemberResponseSchema,
    },
    handler: resolveMemberController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/create',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a member',
      tags: ['integrations-members'],
      response: createMemberBodySchemaResponse,
      body: createMemberBodySchemaRequest,
    },
    handler: createMemberController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/members/add',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Add a member to a workspace',
      tags: ['integrations-members'],
      response: addMemberToWorkspaceBodySchemaResponse,
      body: addMemberToWorkspaceBodySchemaRequest,
    },
    handler: addMemberToWorkspaceController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/:memberId/identities',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Link a platform identity to a member',
      tags: ['integrations-members'],
      params: createMemberIdentityParamsSchema,
      body: createMemberIdentityBodySchema,
      response: createMemberIdentityResponseSchema,
    },
    handler: createMemberIdentityController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/members/by-identity',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Find a member by platform identity (bot-facing)',
      tags: ['integrations-members'],
      query: findMemberByIdentityQuerySchema,
      response: findMemberByIdentityResponseSchema,
    },
    handler: findMemberByIdentityController,
  })
}
