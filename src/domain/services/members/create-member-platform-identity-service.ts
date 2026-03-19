import { trace } from '@opentelemetry/api'
import type { MemberPlatformIdentity } from '@/domain/entities/member-platform-identity'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { insertMemberPlatformIdentity } from '@/infra/db/repositories/member-platform-identities-repository'
import { findById } from '@/infra/db/repositories/members-repository'

export type CreateMemberPlatformIdentityInput = {
  memberId: string
  provider: string
  providerUserId: string
}

export async function createMemberPlatformIdentity(
  input: CreateMemberPlatformIdentityInput
): Promise<MemberPlatformIdentity | DomainError> {
  const tracer = trace.getTracer('create-member-platform-identity')

  return tracer.startActiveSpan(
    'create-member-platform-identity-service',
    async span => {
      const member = await findById(input.memberId)
      if (!member) {
        span.end()
        return new MemberNotFound()
      }

      const result = await insertMemberPlatformIdentity({
        memberId: input.memberId,
        provider: input.provider,
        providerUserId: input.providerUserId,
      })

      span.end()
      return result
    }
  )
}
