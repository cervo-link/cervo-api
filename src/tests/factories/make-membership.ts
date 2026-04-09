import { insertMembership } from '@/infra/db/repositories/membership-repository'
import type { MembershipRole } from '@/infra/db/schema'

export async function makeMembership(
  workspaceId: string,
  memberId: string,
  role: MembershipRole = 'viewer'
) {
  return insertMembership({ workspaceId, memberId, role })
}
