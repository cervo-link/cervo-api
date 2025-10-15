import type { InsertMember, Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { insertMember } from '@/infra/db/repositories/members-repository'

export async function createMember(
  member: InsertMember
): Promise<Member | DomainError> {
  const result = await insertMember(member)
  if (!result) {
    return result
  }

  return result
}
