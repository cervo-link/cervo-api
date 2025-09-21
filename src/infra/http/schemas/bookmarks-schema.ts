import { z } from 'zod'

export const createBookmarkBodySchemaRequest = z.object({
  workspaceId: z.uuidv7().nonempty('Workspace ID is required.'),
  memberId: z.uuidv7().nonempty('Member ID is required.'),
  url: z.url().nonempty('URL is required.'),
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
