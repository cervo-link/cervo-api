import type { Membership } from '@/domain/entities/membership'
import type { DomainError } from '@/domain/errors/domain-error'
import { MembershipNotFound } from '@/domain/errors/membership-not-found'
import { findMembership } from '@/infra/db/repositories/membership-repository'

export async function getMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership | DomainError> {
  const membership = await findMembership(workspaceId, memberId)
  if (!membership) {
    return new MembershipNotFound()
  }

  return membership
}
