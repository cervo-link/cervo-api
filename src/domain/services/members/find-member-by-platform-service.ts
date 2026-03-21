import type { Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { findMemberByProviderIdentity } from '@/infra/db/repositories/member-platform-identities-repository'
import { findById } from '@/infra/db/repositories/members-repository'
import { withSpan } from '@/infra/utils/with-span'

type FindByMemberId = { memberId: string; provider?: never; providerUserId?: never }
type FindByProviderIdentity = { provider: string; providerUserId: string; memberId?: never }
type FindMemberByPlatformInput = FindByMemberId | FindByProviderIdentity

export async function findMemberByPlatform(
  params: FindMemberByPlatformInput
): Promise<Member | DomainError> {
  return withSpan('find-member-by-platform', async () => {
    let member: Member | null = null

    if (params.provider && params.providerUserId) {
      member = await findMemberByProviderIdentity(params.provider, params.providerUserId)
    } else if (params.memberId) {
      member = await findById(params.memberId)
    }

    if (!member) {
      return new MemberNotFound()
    }

    return member
  })
}
