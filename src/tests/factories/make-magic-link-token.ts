import { randomBytes } from 'node:crypto'
import type { InsertMagicLinkToken, MagicLinkToken } from '@/domain/entities/magic-link-token'
import { insertMagicLinkToken } from '@/infra/db/repositories/magic-link-tokens-repository'

type Overrides = Partial<Omit<InsertMagicLinkToken, 'memberId'>> & {
  memberId: string
}

export function makeRawMagicLinkToken(overrides: Overrides): InsertMagicLinkToken {
  return {
    memberId: overrides.memberId,
    token: overrides.token ?? randomBytes(32).toString('hex'),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
    usedAt: overrides.usedAt ?? null,
  }
}

export async function makeMagicLinkToken(overrides: Overrides): Promise<MagicLinkToken> {
  return insertMagicLinkToken(makeRawMagicLinkToken(overrides))
}
