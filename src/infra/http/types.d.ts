

import type { Member } from '@/domain/entities/member'
import type { MembershipRole } from '@/infra/db/schema'

declare module 'fastify' {
  interface FastifyRequest {
    user: { memberId: string }
    member: Member
    memberRole?: MembershipRole
  }
}
