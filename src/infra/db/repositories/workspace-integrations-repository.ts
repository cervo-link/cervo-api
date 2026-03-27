import { and, eq } from 'drizzle-orm'
import type {
  InsertWorkspaceIntegration,
  WorkspaceIntegration,
} from '@/domain/entities/workspace-integration'
import type { Workspace } from '@/domain/entities/workspace'
import { IntegrationAlreadyExists } from '@/domain/errors/integration-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

export async function insertWorkspaceIntegration(
  params: InsertWorkspaceIntegration
): Promise<WorkspaceIntegration | DomainError> {
  return withSpan('insert-workspace-integration', async () => {
    try {
      const [result] = await db
        .insert(schema.workspaceIntegrations)
        .values(params)
        .returning()
      return result
    } catch (error) {
      const pgError = getPgError(error)
      if (pgError?.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new IntegrationAlreadyExists()
      }
      return new DomainError(
        `Failed to insert workspace integration: ${error as string}`,
        500
      )
    }
  })
}

export async function findWorkspaceByIntegration(
  provider: string,
  providerId: string
): Promise<Workspace | null> {
  return withSpan('find-workspace-by-integration', async () => {
    const [result] = await db
      .select({
        id: schema.workspaces.id,
        ownerId: schema.workspaces.ownerId,
        name: schema.workspaces.name,
        description: schema.workspaces.description,
        isPublic: schema.workspaces.isPublic,
        isPersonal: schema.workspaces.isPersonal,
        createdAt: schema.workspaces.createdAt,
        updatedAt: schema.workspaces.updatedAt,
        active: schema.workspaces.active,
      })
      .from(schema.workspaceIntegrations)
      .innerJoin(
        schema.workspaces,
        eq(schema.workspaceIntegrations.workspaceId, schema.workspaces.id)
      )
      .where(
        and(
          eq(schema.workspaceIntegrations.provider, provider),
          eq(schema.workspaceIntegrations.providerId, providerId)
        )
      )
    return result || null
  })
}
