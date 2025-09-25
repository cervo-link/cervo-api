import type { InsertMember, Member } from '@/domain/entities/member'
import { DomainError } from '@/domain/errors/domain-error'
import { insertMember } from '@/infra/db/repositories/members-repository'

export async function createMember(
  member: InsertMember
): Promise<Member | DomainError> {
  const memberResult = await insertMember(member)

  if (memberResult instanceof DomainError) {
    return memberResult
  }

  return memberResult
}
