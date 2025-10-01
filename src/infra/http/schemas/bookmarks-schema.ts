import { z } from 'zod'

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
  201: z
    .object({
      message: z.string(),
    })
    .describe('Bookmark saved.'),
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
  200: z
    .object({
      message: z.string(),
      bookmarks: z
        .object({
          id: z.string().uuid(),
          workspaceId: z.string().uuid(),
          memberId: z.string().uuid(),
          url: z.url(),
          title: z.string().optional(),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        })
        .array(),
    })
    .describe('Bookmarks retrieved successfully'),
}
