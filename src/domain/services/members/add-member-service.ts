import type { InsertMember, Member } from '@/domain/entities/member'
import { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { insertMemberWithTransaction } from '@/infra/db/repositories/members-repository'
import { insertMembershipWithTransaction } from '@/infra/db/repositories/membership-repository'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import { executeTransaction } from '@/infra/db/utils/transactions'

export async function addMemberToWorkspace(
  member: InsertMember,
  workspaceId: string
): Promise<Member | DomainError> {
  const workspace = await findById(workspaceId)

  if (!workspace) {
    return new WorkspaceNotFound()
  }

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
