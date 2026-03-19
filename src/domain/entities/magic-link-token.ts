import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { schema } from '@/infra/db/schema'

export type MagicLinkToken = InferSelectModel<typeof schema.magicLinkTokens>
export type InsertMagicLinkToken = InferInsertModel<typeof schema.magicLinkTokens>
