import type {
  InsertMemberPlatformIdentity,
  MemberPlatformIdentity,
} from '@/domain/entities/member-platform-identity'
import { DomainError } from '@/domain/errors/domain-error'
import { insertMemberPlatformIdentity } from '@/infra/db/repositories/member-platform-identities-repository'

type Overrides = Partial<Omit<InsertMemberPlatformIdentity, 'memberId'>> & {
  memberId: string
}

export function makeRawMemberPlatformIdentity(
  overrides: Overrides
): InsertMemberPlatformIdentity {
  return {
    memberId: overrides.memberId,
    provider: overrides.provider ?? 'discord',
    providerUserId: overrides.providerUserId ?? `user-${Date.now()}`,
  }
}

export async function makeMemberPlatformIdentity(
  overrides: Overrides
): Promise<MemberPlatformIdentity> {
  const result = await insertMemberPlatformIdentity(
    makeRawMemberPlatformIdentity(overrides)
  )
  if (result instanceof DomainError) throw result
  return result
}
