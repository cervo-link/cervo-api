import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { schema } from '@/infra/db/schema'

export type Bookmark = InferSelectModel<typeof schema.bookmarks>
export type InsertBookmark = InferInsertModel<typeof schema.bookmarks>
