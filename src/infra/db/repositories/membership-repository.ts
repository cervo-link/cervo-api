import type { InsertMembership, Membership } from '@/domain/entities/membership'

import type { DomainError } from '@/domain/errors/domain-error'
import { memberships } from '@/infra/db/schema'
import type { Transaction } from '@/infra/db/utils/transactions'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

export async function insertMembershipWithTransaction(
  tx: Transaction,
  membership: InsertMembership
): Promise<Membership | DomainError> {
  try {
    const [result] = await tx.insert(memberships).values(membership).returning()
    return result
  } catch (error) {
    const pgError = getPgError(error)
    if (pgError) {
      if (pgError.code === PgIntegrityConstraintViolation.ForeignKeyViolation) {
        return new WorkspaceNotFound()
      }
    }
    throw error
  }
}
