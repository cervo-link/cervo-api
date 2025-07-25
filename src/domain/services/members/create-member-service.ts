import type { InsertMember, Member } from '@/domain/entities/member'
import { insertMemberWithTransaction } from '@/infra/db/repositories/members-repository'
import { insertMembershipWithTransaction } from '@/infra/db/repositories/membership-repository'
import { executeTransaction } from '@/infra/db/utils/transactions'

export async function createMember(
  member: InsertMember,
  workspaceId: string
): Promise<Member> {
  return await executeTransaction(async tx => {
    const result = await insertMemberWithTransaction(tx, member)

    await insertMembershipWithTransaction(tx, {
      memberId: result.id,
      workspaceId,
    })

    return result
  })
}
