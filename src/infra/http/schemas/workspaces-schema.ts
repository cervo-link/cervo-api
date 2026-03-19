import { z } from 'zod'

export const createWorkspaceBodySchemaRequest = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  description: z.string().optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID'),
})

export const createWorkspaceBodySchemaResponse = {
  500: z.object({ message: z.string() }).describe('Failed to create workspace'),
  400: z.object({ message: z.string() }).describe('Failed to create workspace'),
  422: z
    .object({ message: z.string() })
    .describe('Cannot create workspace due constraint'),
  201: z
    .object({
      workspace: z.object({
        id: z.string(),
        ownerId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        isPublic: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Workspace created.'),
}

export const getWorkspaceQuerySchemaRequest = z.object({
  id: z.string().uuid('Workspace ID must be a valid UUID'),
})

export const getWorkspaceQuerySchemaResponse = {
  500: z.object({ message: z.string() }).describe('Failed to get workspace'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
  200: z
    .object({
      workspace: z.object({
        id: z.string(),
        ownerId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        isPublic: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Workspace found.'),
}
