import { randomBytes } from 'node:crypto'
import { SpanStatusCode, trace } from '@opentelemetry/api'
import { config } from '@/config'
import type { Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { InvalidToken } from '@/domain/errors/invalid-token'
import { TokenExpired } from '@/domain/errors/token-expired'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import {
  findMagicLinkTokenByToken,
  markMagicLinkTokenAsUsed,
} from '@/infra/db/repositories/magic-link-tokens-repository'
import { findById } from '@/infra/db/repositories/members-repository'
import { insertRefreshToken } from '@/infra/db/repositories/refresh-tokens-repository'
import { findByOwnerId } from '@/infra/db/repositories/workspaces-repository'
import { signAccessToken } from '@/infra/utils/jwt'
import { parseDurationMs } from '@/infra/utils/parse-duration'

export type VerifyMagicLinkResult = {
  accessToken: string
  refreshToken: string
  member: Member
}

export async function verifyMagicLink(
  token: string
): Promise<VerifyMagicLinkResult | DomainError> {
  const tracer = trace.getTracer('verify-magic-link')

  return tracer.startActiveSpan('verify-magic-link-service', async span => {
    const tokenRecord = await findMagicLinkTokenByToken(token)

    if (!tokenRecord) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token not found' })
      span.end()
      return new InvalidToken()
    }

    if (tokenRecord.usedAt) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Token already used',
      })
      span.end()
      return new InvalidToken()
    }

    if (tokenRecord.expiresAt < new Date()) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token expired' })
      span.end()
      return new TokenExpired()
    }

    await markMagicLinkTokenAsUsed(tokenRecord.id)

    const member = await findById(tokenRecord.memberId)
    if (!member) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Member not found',
      })
      span.end()
      return new InvalidToken()
    }

    const existingWorkspace = await findByOwnerId(member.id)
    if (!existingWorkspace) {
      await createWorkspace({
        ownerId: member.id,
        name: `${member.name ?? member.email}'s workspace`,
      })
    }

    const accessToken = await signAccessToken(member.id)
    const refreshTokenValue = randomBytes(32).toString('hex')
    const expiresAt = new Date(
      Date.now() +
        parseDurationMs(
          config.jwt.JWT_REFRESH_EXPIRES_IN,
          7 * 24 * 60 * 60 * 1000
        )
    )

    await insertRefreshToken({
      memberId: member.id,
      token: refreshTokenValue,
      expiresAt,
    })

    span.end()
    return { accessToken, refreshToken: refreshTokenValue, member }
  })
}
