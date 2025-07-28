import type { InsertMember, Member } from '@/domain/entities/member'
import { DomainError } from '@/domain/errors/domain-error'
import { insertMemberWithTransaction } from '@/infra/db/repositories/members-repository'
import { insertMembershipWithTransaction } from '@/infra/db/repositories/membership-repository'
import { executeTransaction } from '@/infra/db/utils/transactions'

export async function createMember(
  member: InsertMember,
  workspaceId: string
): Promise<Member | DomainError> {
  return await executeTransaction(async tx => {
    const memberResult = await insertMemberWithTransaction(tx, member)

    if (memberResult instanceof DomainError) {
      return memberResult
    }

    const membership = await insertMembershipWithTransaction(tx, {
      memberId: memberResult.id,
      workspaceId,
    })

    if (membership instanceof DomainError) {
      return membership
    }

    return memberResult
  })
}
