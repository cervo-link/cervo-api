import { trace } from '@opentelemetry/api'
import type { Membership } from '@/domain/entities/membership'
import type { DomainError } from '@/domain/errors/domain-error'
import { MembershipNotFound } from '@/domain/errors/membership-not-found'
import { findMembership } from '@/infra/db/repositories/membership-repository'

export async function getMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership | DomainError> {
  const tracer = trace.getTracer('get-membership')

  return tracer.startActiveSpan('get-membership-service', async span => {
    const membership = await findMembership(workspaceId, memberId)
    if (!membership) {
      span.end()
      return new MembershipNotFound()
    }

    span.end()
    return membership
  })
}
