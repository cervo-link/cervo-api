import { z } from 'zod'

export const createMemberBodySchemaRequest = z.object({
  name: z.string('Name must be a valid string'),
  username: z.string('Username must be a valid string'),
  email: z.string('Email must be a valid string'),
  discordUserId: z.string('Discord User ID must be a valid string'),
  password: z.string('Password must be a valid string'),
})

export const createMemberBodySchemaResponse = {
  500: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create member'),
  400: z
    .object({
      message: z.string(),
    })
    .describe('Failed to create member'),
  201: z
    .object({
      member: z.object({
        id: z.string(),
        name: z.string().nullable(),
        username: z.string().nullable(),
        email: z.string().nullable(),
        discordUserId: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        active: z.boolean(),
      }),
    })
    .describe('Member saved.'),
}

export const addMemberToWorkspaceBodySchemaRequest = z.object({
  workspaceId: z.string('Workspace ID must be a valid string'),
  memberId: z.string('Member ID must be a valid string'),
})

export const addMemberToWorkspaceBodySchemaResponse = {
  500: z
    .object({
      message: z.string(),
    })
    .describe('Failed to add member to workspace'),
  400: z
    .object({
      message: z.string(),
    })
    .describe('Failed to add member to workspace'),
  201: z
    .object({
      message: z.string(),
    })
    .describe('Member invited to workspace.'),
}
