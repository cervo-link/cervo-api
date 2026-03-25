import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { schema } from '@/infra/db/schema'

export type WaitingListEntry = InferSelectModel<typeof schema.waitingList>
export type InsertWaitingListEntry = InferInsertModel<typeof schema.waitingList>
