import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { apiKeyAuth } from '@/infra/http/middlewares/api-key-auth'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import {
  createMemberIdentityController,
  findMemberByIdentityController,
} from '../controllers/member-identities-controller'
import {
  addMemberToWorkspaceController,
  createMemberController,
  getMeController,
  syncMemberController,
} from '../controllers/members-controller'
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
  getMeResponseSchema,
  syncMemberResponseSchema,
} from '../schemas/members-schema'

export async function memberRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/members/me',
    onRequest: [sessionAuth],
    schema: {
      description: 'Get the currently authenticated member',
      tags: ['members'],
      response: getMeResponseSchema,
    },
    handler: getMeController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/sync',
    schema: {
      description: 'Create member from active session if not exists (idempotent)',
      tags: ['members'],
      response: syncMemberResponseSchema,
    },
    handler: syncMemberController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/members/create',
    onRequest: [apiKeyAuth],
    schema: {
      description: 'Create a member',
      tags: ['members'],
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
      tags: ['members'],
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
      tags: ['members'],
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
      tags: ['members'],
      query: findMemberByIdentityQuerySchema,
      response: findMemberByIdentityResponseSchema,
    },
    handler: findMemberByIdentityController,
  })
}
