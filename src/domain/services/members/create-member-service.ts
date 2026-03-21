import type { InsertMember, Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { insertMember } from '@/infra/db/repositories/members-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function createMember(
  member: InsertMember
): Promise<Member | DomainError> {
  return withSpan('create-member', () => insertMember(member))
}
