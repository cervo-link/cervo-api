import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { schema } from '@/infra/db/schema'

export const bookmarkSchema = createSelectSchema(schema.bookmarks).omit({
  embedding: true,
})

export const createBookmarkBodySchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
  memberId: z.string().uuid('Member ID must be a valid UUID'),
  url: z.string().url('URL must be a valid URL'),
})

export const createBookmarkBodySchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Failed to create bookmark'),
  400: z
    .object({ message: z.string() })
    .describe('Failed to create bookmark'),
  201: z
    .object({ message: z.string() })
    .describe('Bookmark created successfully'),
}

export const getBookmarksQuerySchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
  memberId: z.string().uuid('Member ID must be a valid UUID'),
  text: z.string().min(1, 'Text must not be empty'),
  limit: z.coerce.number().int().min(1).max(50).default(5),
})

export const getBookmarksBodySchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Failed to get bookmarks'),
  400: z
    .object({ message: z.string() })
    .describe('Failed to get bookmarks'),
  200: z.array(bookmarkSchema).describe('Bookmarks retrieved successfully'),
}
