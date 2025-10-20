import { trace } from '@opentelemetry/api'
import type { InsertMember, Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { insertMember } from '@/infra/db/repositories/members-repository'

export async function createMember(
  member: InsertMember
): Promise<Member | DomainError> {
  const tracer = trace.getTracer('create-member')

  return tracer.startActiveSpan('create-member-service', async span => {
    const result = await insertMember(member)
    if (!result) {
      span.end()
      return result
    }

    span.end()
    return result
  })
}
