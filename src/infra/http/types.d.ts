export {}

import type { Member } from '@/domain/entities/member'

declare module 'fastify' {
  interface FastifyRequest {
    user: { memberId: string }
    member: Member
  }
}
