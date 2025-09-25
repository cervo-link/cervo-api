import type { InsertMember, Member } from '@/domain/entities/member'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { insertMemberWithTransaction } from '@/infra/db/repositories/members-repository'
import { insertMembershipWithTransaction } from '@/infra/db/repositories/membership-repository'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { executeTransaction } from '@/infra/db/utils/transactions'

export async function addMemberToWorkspace(
  member: InsertMember,
  workspaceId: string
): Promise<Member | DomainError> {
  const workspace = await findById(workspaceId)

  if (!workspace) {
    return new WorkspaceNotFound()
  }

  try {
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
  } catch (error) {
    const pgError = getPgError(error)
    if (pgError && pgError.code === '23505') {
      return new CannotCreateDuplicatedMember()
    }
    throw error
  }
}
