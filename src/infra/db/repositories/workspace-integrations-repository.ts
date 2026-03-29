import { and, eq } from 'drizzle-orm'
import type {
  InsertWorkspaceIntegration,
  WorkspaceIntegration,
} from '@/domain/entities/workspace-integration'
import type { Workspace } from '@/domain/entities/workspace'
import { IntegrationAlreadyExists } from '@/domain/errors/integration-already-exists'
import type { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schema'
import { handleInsertError } from '@/infra/db/utils/insert-with-error-handling'

export async function insertWorkspaceIntegration(
  params: InsertWorkspaceIntegration
): Promise<WorkspaceIntegration | DomainError> {
  return withSpan('insert-workspace-integration', () =>
    handleInsertError(
      () => db.insert(schema.workspaceIntegrations).values(params).returning(),
      IntegrationAlreadyExists,
      'Failed to insert workspace integration'
    )
  )
}

export async function findIntegrationsByWorkspaceId(
  workspaceId: string
): Promise<WorkspaceIntegration[]> {
  return withSpan('find-integrations-by-workspace-id', async () => {
    return db
      .select()
      .from(schema.workspaceIntegrations)
      .where(eq(schema.workspaceIntegrations.workspaceId, workspaceId))
  })
}

export async function deleteIntegrationById(
  id: string,
  workspaceId: string
): Promise<boolean> {
  return withSpan('delete-integration-by-id', async () => {
    const result = await db
      .delete(schema.workspaceIntegrations)
      .where(
        and(
          eq(schema.workspaceIntegrations.id, id),
          eq(schema.workspaceIntegrations.workspaceId, workspaceId)
        )
      )
      .returning()
    return result.length > 0
  })
}

export async function deleteIntegrationByProvider(
  provider: string,
  providerId: string
): Promise<boolean> {
  return withSpan('delete-integration-by-provider', async () => {
    const result = await db
      .delete(schema.workspaceIntegrations)
      .where(
        and(
          eq(schema.workspaceIntegrations.provider, provider),
          eq(schema.workspaceIntegrations.providerId, providerId)
        )
      )
      .returning()
    return result.length > 0
  })
}

export async function updateIntegrationProviderName(
  provider: string,
  providerId: string,
  providerName: string
): Promise<WorkspaceIntegration | null> {
  return withSpan('update-integration-provider-name', async () => {
    const [result] = await db
      .update(schema.workspaceIntegrations)
      .set({ providerName, updatedAt: new Date() })
      .where(
        and(
          eq(schema.workspaceIntegrations.provider, provider),
          eq(schema.workspaceIntegrations.providerId, providerId)
        )
      )
      .returning()
    return result || null
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
