import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  logoutController,
  refreshTokenController,
  requestMagicLinkController,
  verifyMagicLinkController,
} from '@/infra/http/controllers/auth-controller'
import {
  logoutBodySchema,
  logoutResponseSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  requestMagicLinkBodySchema,
  requestMagicLinkResponseSchema,
  verifyMagicLinkBodySchema,
  verifyMagicLinkResponseSchema,
} from '@/infra/http/schemas/auth-schema'

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/auth/magic-link',
    schema: {
      description: 'Request a magic link sign-in email',
      tags: ['auth'],
      body: requestMagicLinkBodySchema,
      response: requestMagicLinkResponseSchema,
    },
    handler: requestMagicLinkController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/auth/verify',
    schema: {
      description: 'Verify a magic link token and receive JWT tokens',
      tags: ['auth'],
      body: verifyMagicLinkBodySchema,
      response: verifyMagicLinkResponseSchema,
    },
    handler: verifyMagicLinkController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/auth/refresh',
    schema: {
      description: 'Refresh access token using a refresh token',
      tags: ['auth'],
      body: refreshTokenBodySchema,
      response: refreshTokenResponseSchema,
    },
    handler: refreshTokenController,
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/auth/logout',
    schema: {
      description: 'Revoke a refresh token (logout)',
      tags: ['auth'],
      body: logoutBodySchema,
      response: logoutResponseSchema,
    },
    handler: logoutController,
  })
}
