import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { schema } from '@/infra/db/schema'

export type WorkspaceIntegration = InferSelectModel<typeof schema.workspaceIntegrations>
export type InsertWorkspaceIntegration = InferInsertModel<typeof schema.workspaceIntegrations>
