import { trace } from '@opentelemetry/api'
import { eq } from 'drizzle-orm'
import type { InsertRefreshToken, RefreshToken } from '@/domain/entities/refresh-token'
import { db } from '@/infra/db'
import { refreshTokens } from '@/infra/db/schema'

export async function insertRefreshToken(
  params: InsertRefreshToken
): Promise<RefreshToken> {
  const tracer = trace.getTracer('insert-refresh-token')

  return tracer.startActiveSpan(
    'insert-refresh-token-repository',
    async span => {
      const [result] = await db
        .insert(refreshTokens)
        .values(params)
        .returning()
      span.end()
      return result
    }
  )
}

export async function findRefreshTokenByToken(
  token: string
): Promise<RefreshToken | null> {
  const tracer = trace.getTracer('find-refresh-token')

  return tracer.startActiveSpan('find-refresh-token-repository', async span => {
    const [result] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
    span.end()
    return result || null
  })
}

export async function revokeRefreshToken(id: string): Promise<void> {
  const tracer = trace.getTracer('revoke-refresh-token')

  return tracer.startActiveSpan('revoke-refresh-token-repository', async span => {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id))
    span.end()
  })
}
