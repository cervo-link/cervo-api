import type { MemberPlatformIdentity } from '@/domain/entities/member-platform-identity'
import type { DomainError } from '@/domain/errors/domain-error'
import { IdentityAlreadyLinked } from '@/domain/errors/identity-already-linked'
import { IdentityLinkedToDifferentMember } from '@/domain/errors/identity-linked-to-different-member'
import {
  findMemberByProviderIdentity,
  insertMemberPlatformIdentity,
  insertMemberPlatformIdentityWithTransaction,
} from '@/infra/db/repositories/member-platform-identities-repository'
import { executeTransaction } from '@/infra/db/utils/transactions'
import { withSpan } from '@/infra/utils/with-span'
import { mergeMembersInTransaction } from './merge-members-service'

export type LinkMemberIdentityInput = {
  realMemberId: string
  provider: string
  providerUserId: string
}

export async function linkMemberIdentity(
  input: LinkMemberIdentityInput
): Promise<MemberPlatformIdentity | DomainError> {
  return withSpan('link-member-identity', async () => {
    const { realMemberId, provider, providerUserId } = input

    const linkedMember = await findMemberByProviderIdentity(provider, providerUserId)

    if (linkedMember) {
      if (linkedMember.id === realMemberId) {
        return new IdentityAlreadyLinked()
      }

      if (linkedMember.userId === null) {
        // Shadow member — merge into real member then create identity atomically
        return executeTransaction(async tx => {
          const mergeError = await mergeMembersInTransaction(
            tx,
            linkedMember.id,
            realMemberId
          )
          if (mergeError) return mergeError

          return insertMemberPlatformIdentityWithTransaction(tx, {
            memberId: realMemberId,
            provider,
            providerUserId,
          })
        })
      }

      return new IdentityLinkedToDifferentMember()
    }

    return insertMemberPlatformIdentity({ memberId: realMemberId, provider, providerUserId })
  })
}
