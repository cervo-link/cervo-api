import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { schema } from '@/infra/db/schema'

export type Membership = InferSelectModel<typeof schema.memberships>
export type InsertMembership = InferInsertModel<typeof schema.memberships>
