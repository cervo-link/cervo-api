import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { schema } from '@/infra/db/schema'

export type RefreshToken = InferSelectModel<typeof schema.refreshTokens>
export type InsertRefreshToken = InferInsertModel<typeof schema.refreshTokens>
