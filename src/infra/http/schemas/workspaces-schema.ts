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

const workspaceShape = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  isPersonal: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

export const getMyWorkspacesSchemaResponse = {
  500: z.object({ message: z.string() }).describe('Failed to get workspaces'),
  200: z
    .object({ workspaces: z.array(workspaceShape) })
    .describe('List of workspaces the member belongs to'),
}

export const updateWorkspaceParamsSchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
})

export const updateWorkspaceBodySchemaRequest = z
  .object({
    name: z.string().min(1, 'Name must not be empty').optional(),
    description: z.string().nullable().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(d => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateWorkspaceSchemaResponse = {
  500: z.object({ message: z.string() }).describe('Internal error'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
  403: z.object({ message: z.string() }).describe('Forbidden'),
  400: z.object({ message: z.string() }).describe('Bad request'),
  200: z
    .object({
      workspace: z.object({
        id: z.string(),
        ownerId: z.string().nullable(),
        name: z.string(),
        description: z.string().nullable(),
        isPublic: z.boolean(),
        isPersonal: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Workspace updated'),
}

export const deleteWorkspaceParamsSchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
})

export const deleteWorkspaceSchemaResponse = {
  500: z.object({ message: z.string() }).describe('Internal error'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
  403: z.object({ message: z.string() }).describe('Forbidden'),
  204: z.void().describe('Workspace deleted'),
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
