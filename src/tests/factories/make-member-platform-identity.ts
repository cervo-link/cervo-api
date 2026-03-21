import type {
  InsertMemberPlatformIdentity,
  MemberPlatformIdentity,
} from '@/domain/entities/member-platform-identity'
import { insertMemberPlatformIdentity } from '@/infra/db/repositories/member-platform-identities-repository'
import { unwrapOrThrow } from './unwrap'

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
  return unwrapOrThrow(
    await insertMemberPlatformIdentity(makeRawMemberPlatformIdentity(overrides))
  )
}
