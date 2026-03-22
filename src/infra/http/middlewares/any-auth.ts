import type { FastifyReply, FastifyRequest } from 'fastify'

type AuthMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>

/**
 * Tries each middleware in order. Passes if any one succeeds.
 * A middleware is considered to have succeeded if it did not send a reply.
 */
export function anyAuth(...middlewares: AuthMiddleware[]): AuthMiddleware {
  return async (request, reply) => {
    for (const middleware of middlewares) {
      let rejected = false

      const replyMock = new Proxy(reply, {
        get(target, prop: string) {
          if (prop === 'sent') return rejected
          if (prop === 'code') {
            return () => ({
              send: () => {
                rejected = true
              },
            })
          }
          return Reflect.get(target, prop)
        },
      })

      await middleware(request, replyMock as FastifyReply)

      if (!rejected) return
    }

    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required.',
      statusCode: 401,
    })
  }
}
