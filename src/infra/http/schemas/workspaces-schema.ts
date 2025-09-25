import { z } from 'zod'

export const createWorkspaceBodySchemaRequest = z.object({
  name: z.string('Name must be a valid string'),
  description: z.string('Description must be a valid string'),
  platform: z.enum(['discord', 'slack', 'telegram']),
  platformId: z.string('Platform ID must be a vali  d string'),
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
  201: z
    .object({
      message: z.string(),
    })
    .describe('Workspace created.'),
}
