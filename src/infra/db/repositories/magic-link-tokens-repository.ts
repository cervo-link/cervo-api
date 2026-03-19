import { trace } from '@opentelemetry/api'
import { eq } from 'drizzle-orm'
import type { InsertMagicLinkToken, MagicLinkToken } from '@/domain/entities/magic-link-token'
import { db } from '@/infra/db'
import { magicLinkTokens } from '@/infra/db/schema'

export async function insertMagicLinkToken(
  params: InsertMagicLinkToken
): Promise<MagicLinkToken> {
  const tracer = trace.getTracer('insert-magic-link-token')

  return tracer.startActiveSpan(
    'insert-magic-link-token-repository',
    async span => {
      const [result] = await db
        .insert(magicLinkTokens)
        .values(params)
        .returning()
      span.end()
      return result
    }
  )
}

export async function findMagicLinkTokenByToken(
  token: string
): Promise<MagicLinkToken | null> {
  const tracer = trace.getTracer('find-magic-link-token')

  return tracer.startActiveSpan(
    'find-magic-link-token-repository',
    async span => {
      const [result] = await db
        .select()
        .from(magicLinkTokens)
        .where(eq(magicLinkTokens.token, token))
      span.end()
      return result || null
    }
  )
}

export async function markMagicLinkTokenAsUsed(id: string): Promise<void> {
  const tracer = trace.getTracer('mark-magic-link-token-as-used')

  return tracer.startActiveSpan(
    'mark-magic-link-token-as-used-repository',
    async span => {
      await db
        .update(magicLinkTokens)
        .set({ usedAt: new Date() })
        .where(eq(magicLinkTokens.id, id))
      span.end()
    }
  )
}
