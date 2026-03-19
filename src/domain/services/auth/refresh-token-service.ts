import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { DomainError } from '@/domain/errors/domain-error'
import { InvalidToken } from '@/domain/errors/invalid-token'
import { TokenExpired } from '@/domain/errors/token-expired'
import { findRefreshTokenByToken } from '@/infra/db/repositories/refresh-tokens-repository'
import { signAccessToken } from '@/infra/utils/jwt'

export async function refreshAccessToken(
  token: string
): Promise<{ accessToken: string } | DomainError> {
  const tracer = trace.getTracer('refresh-token')

  return tracer.startActiveSpan('refresh-token-service', async span => {
    const tokenRecord = await findRefreshTokenByToken(token)

    if (!tokenRecord) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token not found' })
      span.end()
      return new InvalidToken()
    }

    if (tokenRecord.revokedAt) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token revoked' })
      span.end()
      return new InvalidToken()
    }

    if (tokenRecord.expiresAt < new Date()) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token expired' })
      span.end()
      return new TokenExpired()
    }

    const accessToken = await signAccessToken(tokenRecord.memberId)
    span.end()
    return { accessToken }
  })
}
