import { z } from 'zod'

export const createBookmarkBodySchemaRequest = z.object({
  workspaceId: z
    .string()
    .uuid('Workspace ID must be a valid UUID')
    .min(1, 'Workspace ID is required.'),
  memberId: z
    .string()
    .uuid('Member ID must be a valid UUID')
    .min(1, 'Member ID is required.'),
  url: z.string().url('URL must be a valid URL').min(1, 'URL is required.'),
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
