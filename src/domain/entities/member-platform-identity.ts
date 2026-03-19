import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { schema } from '@/infra/db/schema'

export type MemberPlatformIdentity = InferSelectModel<typeof schema.memberPlatformIdentities>
export type InsertMemberPlatformIdentity = InferInsertModel<
  typeof schema.memberPlatformIdentities
>
