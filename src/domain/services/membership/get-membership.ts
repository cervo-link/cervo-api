import type { Membership } from '@/domain/entities/membership'
import { MembershipNotFound } from '@/domain/errors/membership-not-found'
import { findMembership } from '@/infra/db/repositories/membership-repository'

export async function getMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership> {
  const membership = await findMembership(workspaceId, memberId)
  if (!membership) {
    throw new MembershipNotFound()
  }

  return membership
}
