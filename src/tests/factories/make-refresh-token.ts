import { randomBytes } from 'node:crypto'
import type { InsertRefreshToken, RefreshToken } from '@/domain/entities/refresh-token'
import { insertRefreshToken } from '@/infra/db/repositories/refresh-tokens-repository'

type Overrides = Partial<Omit<InsertRefreshToken, 'memberId'>> & {
  memberId: string
}

export function makeRawRefreshToken(overrides: Overrides): InsertRefreshToken {
  return {
    memberId: overrides.memberId,
    token: overrides.token ?? randomBytes(32).toString('hex'),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: overrides.revokedAt ?? null,
  }
}

export async function makeRefreshToken(overrides: Overrides): Promise<RefreshToken> {
  return insertRefreshToken(makeRawRefreshToken(overrides))
}
