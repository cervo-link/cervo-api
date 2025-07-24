import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { schema } from '@/infra/db/schema'

export type Workspace = InferSelectModel<typeof schema.workspaces>
export type InsertWorkspace = InferInsertModel<typeof schema.workspaces>
