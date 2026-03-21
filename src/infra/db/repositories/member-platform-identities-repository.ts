import { and, eq } from 'drizzle-orm'
import type {
  InsertMemberPlatformIdentity,
  MemberPlatformIdentity,
} from '@/domain/entities/member-platform-identity'
import type { Member } from '@/domain/entities/member'
import { IdentityAlreadyExists } from '@/domain/errors/identity-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

export async function insertMemberPlatformIdentity(
  params: InsertMemberPlatformIdentity
): Promise<MemberPlatformIdentity | DomainError> {
  return withSpan('insert-member-platform-identity', async () => {
    try {
      const [result] = await db
        .insert(schema.memberPlatformIdentities)
        .values(params)
        .returning()
      return result
    } catch (error) {
      const pgError = getPgError(error)
      if (pgError?.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new IdentityAlreadyExists()
      }
      return new DomainError(
        `Failed to insert member platform identity: ${error as string}`,
        500
      )
    }
  })
}

export async function findMemberByProviderIdentity(
  provider: string,
  providerUserId: string
): Promise<Member | null> {
  return withSpan('find-member-by-provider-identity', async () => {
    const [result] = await db
      .select({
        id: schema.members.id,
        userId: schema.members.userId,
        name: schema.members.name,
        username: schema.members.username,
        email: schema.members.email,
        createdAt: schema.members.createdAt,
        updatedAt: schema.members.updatedAt,
        active: schema.members.active,
      })
      .from(schema.memberPlatformIdentities)
      .innerJoin(
        schema.members,
        eq(schema.memberPlatformIdentities.memberId, schema.members.id)
      )
      .where(
        and(
          eq(schema.memberPlatformIdentities.provider, provider),
          eq(schema.memberPlatformIdentities.providerUserId, providerUserId)
        )
      )
    return result || null
  })
}
