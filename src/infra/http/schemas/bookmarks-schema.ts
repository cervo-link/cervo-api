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
