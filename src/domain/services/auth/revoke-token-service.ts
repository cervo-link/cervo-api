import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { DomainError } from '@/domain/errors/domain-error'
import { InvalidToken } from '@/domain/errors/invalid-token'
import {
  findRefreshTokenByToken,
  revokeRefreshToken,
} from '@/infra/db/repositories/refresh-tokens-repository'

export async function revokeToken(token: string): Promise<undefined | DomainError> {
  const tracer = trace.getTracer('revoke-token')

  return tracer.startActiveSpan('revoke-token-service', async span => {
    const tokenRecord = await findRefreshTokenByToken(token)

    if (!tokenRecord) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Token not found' })
      span.end()
      return new InvalidToken()
    }

    await revokeRefreshToken(tokenRecord.id)
    span.end()
  })
}
