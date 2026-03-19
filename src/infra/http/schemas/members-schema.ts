import { z } from 'zod'

export const createMemberBodySchemaRequest = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  username: z.string().min(1, 'Username must not be empty'),
  email: z.string().email('Email must be a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const createMemberBodySchemaResponse = {
  500: z.object({ message: z.string() }).describe('Failed to create member'),
  400: z.object({ message: z.string() }).describe('Failed to create member'),
  422: z
    .object({ message: z.string() })
    .describe('Member already exists'),
  201: z
    .object({
      member: z.object({
        id: z.string(),
        name: z.string().nullable(),
        username: z.string().nullable(),
        email: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Member created.'),
}

export const addMemberToWorkspaceBodySchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
  memberId: z.string().uuid('Member ID must be a valid UUID'),
})

export const addMemberToWorkspaceBodySchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Failed to add member to workspace'),
  400: z
    .object({ message: z.string() })
    .describe('Failed to add member to workspace'),
  404: z
    .object({ message: z.string() })
    .describe('Workspace or member not found'),
  422: z.object({ message: z.string() }).describe('Membership already exists'),
  201: z
    .object({ message: z.string() })
    .describe('Member invited to workspace.'),
}
