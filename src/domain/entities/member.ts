import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { schema } from '@/infra/db/schema'

export type Member = InferSelectModel<typeof schema.members>
export type InsertMember = InferInsertModel<typeof schema.members>
