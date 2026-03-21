import type { Membership } from '@/domain/entities/membership'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findById as findMemberById } from '@/infra/db/repositories/members-repository'
import { insertMembership } from '@/infra/db/repositories/membership-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function addMemberToWorkspace(
  memberId: string,
  workspaceId: string
): Promise<Membership | DomainError> {
  return withSpan('add-member-to-workspace', async () => {
    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) {
      return new WorkspaceNotFound()
    }

    const member = await findMemberById(memberId)
    if (!member) {
      return new MemberNotFound()
    }

    return insertMembership({ memberId, workspaceId })
  })
}
