import { z } from 'zod'

export const createWorkspaceBodySchemaRequest = z.object({
  name: z.string('Name must be a valid string'),
  description: z.string('Description must be a valid string'),
  platform: z.enum(['discord', 'slack', 'telegram']),
  platformId: z.string('Platform ID must be a valid string'),
})

export const createWorkspaceBodySchemaResponse = {
  500: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create workspace'),
  400: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create workspace'),
  422: z
    .object({
      message: z.string(),
    })
    .describe('Cannot create workspace due constraint'),
  201: z
    .object({
      workspace: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        platform: z.string(),
        platformId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Workspace created.'),
}
