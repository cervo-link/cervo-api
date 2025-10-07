import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { schema } from '@/infra/db/schema'

export const bookmarkSchema = createSelectSchema(schema.bookmarks).omit({
  embedding: true,
})

export const createBookmarkBodySchemaRequest = z.object({
  workspaceId: z.uuid('Workspace ID must be a valid UUID'),
  memberId: z.uuid('Member ID must be a valid UUID'),
  url: z.string().url('URL must be a valid URL'),
})

export const createBookmarkBodySchemaResponse = {
  500: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create bookmark'),
  400: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create bookmark'),
  201: bookmarkSchema.describe('Bookmark created successfully'),
}

export const getBookmarksQuerySchemaRequest = z.object({
  workspaceId: z.uuid('Workspace ID must be a valid UUID'),
  memberId: z.uuid('Member ID must be a valid UUID'),
  text: z.string('Text must be a string'),
})

export const getBookmarksBodySchemaResponse = {
  500: z
    .object({
      message: z.string(),
    })
    .describe('Failed to get bookmarks'),
  400: z
    .object({
      message: z.string(),
    })
    .describe('Failed to get bookmarks'),
  200: z.array(bookmarkSchema).describe('Bookmarks retrieved successfully'),
}
