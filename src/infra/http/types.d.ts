export {}

declare module 'fastify' {
  interface FastifyRequest {
    user: { memberId: string }
  }
}
