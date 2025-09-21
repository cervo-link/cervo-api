import { z } from 'zod'

export const createBookmarkQuerySchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required.'),
  memberId: z.string().min(1, 'Member ID is required.'),
  url: z.string().min(1, 'URL is required.'),
})

export const createBookmarkResponseSchema = {
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
