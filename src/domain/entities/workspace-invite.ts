import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { schema } from '@/infra/db/schema'

export type WorkspaceInvite = InferSelectModel<typeof schema.workspaceInvites>
export type InsertWorkspaceInvite = InferInsertModel<
  typeof schema.workspaceInvites
>
