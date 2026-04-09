import type { Membership } from '@/domain/entities/membership'
import { DomainError } from '@/domain/errors/domain-error'
import { findByEmail } from '@/infra/db/repositories/members-repository'
import { insertMembership } from '@/infra/db/repositories/membership-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'
import type { MembershipRole } from '@/infra/db/schema'
import { withSpan } from '@/infra/utils/with-span'

export async function inviteMemberByEmail(
  workspaceId: string,
  email: string,
  role: MembershipRole = 'viewer'
): Promise<Membership | DomainError> {
  return withSpan('invite-member-by-email', async () => {
    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) return new DomainError('Workspace not found', 404)

    const member = await findByEmail(email)
    if (!member) return new DomainError('No member found with that email', 404)

    return insertMembership({ memberId: member.id, workspaceId, role })
  })
}
