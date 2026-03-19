import { trace } from '@opentelemetry/api'
import type { Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { findById } from '@/infra/db/repositories/members-repository'

type FindMemberByPlatformInput = {
  memberId?: string
}

// NOTE: Phase 3 will replace this with member_platform_identities lookup.
// Until then, all platforms resolve a member by their Cervo memberId directly.
export async function findMemberByPlatform(
  params: FindMemberByPlatformInput
): Promise<Member | DomainError> {
  const tracer = trace.getTracer('find-member-by-platform')

  return tracer.startActiveSpan(
    'find-member-by-platform-service',
    async span => {
      if (!params.memberId) {
        span.end()
        return new MemberNotFound()
      }

      const member = await findById(params.memberId)

      if (!member) {
        span.end()
        return new MemberNotFound()
      }

      span.end()
      return member
    }
  )
}
