import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { sessionAuth } from '@/infra/http/middlewares/session-auth'
import {
  getMemberIdentitiesController,
  linkMemberIdentityController,
} from '@/infra/http/controllers/member-identities-controller'
import {
  getMeController,
  syncMemberController,
} from '@/infra/http/controllers/members-controller'
import {
  getMeResponseSchema,
  getMemberIdentitiesResponseSchema,
  linkMemberIdentityBodySchema,
  linkMemberIdentityResponseSchema,
  syncMemberResponseSchema,
} from '@/infra/http/schemas/members-schema'

export async function apiMembersRoutes(app: FastifyInstance) {
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
    url: '/members/me/identities',
    onRequest: [sessionAuth],
    schema: {
      description: 'Link a provider identity to the authenticated member, merging any shadow member',
      tags: ['members'],
      body: linkMemberIdentityBodySchema,
      response: linkMemberIdentityResponseSchema,
    },
    handler: linkMemberIdentityController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/members/me/identities',
    onRequest: [sessionAuth],
    schema: {
      description: 'List all provider identities linked to the authenticated member',
      tags: ['members'],
      response: getMemberIdentitiesResponseSchema,
    },
    handler: getMemberIdentitiesController,
  })
}
