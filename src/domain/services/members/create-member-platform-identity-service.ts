import type { MemberPlatformIdentity } from '@/domain/entities/member-platform-identity'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { insertMemberPlatformIdentity } from '@/infra/db/repositories/member-platform-identities-repository'
import { findById } from '@/infra/db/repositories/members-repository'
import { withSpan } from '@/infra/utils/with-span'

export type CreateMemberPlatformIdentityInput = {
  memberId: string
  provider: string
  providerUserId: string
}

export async function createMemberPlatformIdentity(
  input: CreateMemberPlatformIdentityInput
): Promise<MemberPlatformIdentity | DomainError> {
  return withSpan('create-member-platform-identity', async () => {
    const member = await findById(input.memberId)
    if (!member) {
      return new MemberNotFound()
    }

    return insertMemberPlatformIdentity({
      memberId: input.memberId,
      provider: input.provider,
      providerUserId: input.providerUserId,
    })
  })
}
