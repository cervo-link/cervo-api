import { trace } from '@opentelemetry/api'
import type { Membership } from '@/domain/entities/membership'
import { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findById as findMemberById } from '@/infra/db/repositories/members-repository'
import { insertMembership } from '@/infra/db/repositories/membership-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'

export async function addMemberToWorkspace(
  memberId: string,
  workspaceId: string
): Promise<Membership | DomainError> {
  const tracer = trace.getTracer('add-member-to-workspace')

  return tracer.startActiveSpan(
    'add-member-to-workspace-service',
    async span => {
      const workspace = await findWorkspaceById(workspaceId)

      if (!workspace) {
        span.end()
        return new WorkspaceNotFound()
      }

      const member = await findMemberById(memberId)
      if (!member) {
        span.end()
        return new MemberNotFound()
      }

      const membership = await insertMembership({
        memberId,
        workspaceId,
      })

      if (membership instanceof DomainError) {
        span.end()
        return membership
      }

      span.end()
      return membership
    }
  )
}
