import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { schema } from '@/infra/db/schema'

export const bookmarkSchema = createSelectSchema(schema.bookmarks).omit({
  embedding: true,
})

export const createBookmarkBodySchemaRequest = z
  .object({
    platformId: z.string().min(1, 'Platform ID must not be empty'),
    platform: z.enum(['discord', 'slack', 'telegram'], {
      message: 'Platform must be discord, slack, or telegram',
    }),
    discordId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    url: z.string().url('URL must be a valid URL'),
  })
  .refine(
    data => (data.platform === 'discord' ? !!data.discordId : !!data.userId),
    {
      message:
        'discordId is required when platform is discord, userId is required otherwise',
    }
  )

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
    .describe('Bookmark created successfully'),
}

export const getBookmarksQuerySchemaRequest = z
  .object({
    platformId: z.string().min(1, 'Platform ID must not be empty'),
    platform: z.enum(['discord', 'slack', 'telegram'], {
      message: 'Platform must be discord, slack, or telegram',
    }),
    discordId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    text: z.string().min(1, 'Text must not be empty'),
    limit: z.coerce.number().int().min(1).max(50).default(5),
  })
  .refine(
    data => (data.platform === 'discord' ? !!data.discordId : !!data.userId),
    {
      message:
        'discordId is required when platform is discord, userId is required otherwise',
    }
  )

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
