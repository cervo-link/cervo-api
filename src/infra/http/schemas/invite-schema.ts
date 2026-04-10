import { z } from 'zod'

export const createInviteParamsSchemaRequest = z.object({
  workspaceId: z.string().uuid('Workspace ID must be a valid UUID'),
})

export const createInviteBodySchemaRequest = z.object({
  email: z.string().email('Email must be a valid email'),
  role: z.enum(['viewer', 'editor']).default('viewer'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

export const createInviteSchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Internal error'),
  404: z
    .object({ message: z.string() })
    .describe('Workspace not found'),
  403: z
    .object({ message: z.string() })
    .describe('Forbidden'),
  201: z
    .object({
      token: z.string(),
      inviteUrl: z.string(),
      expiresAt: z.date(),
    })
    .describe('Invite created'),
}

export const getInviteParamsSchemaRequest = z.object({
  token: z.string().min(1),
})

export const getInviteSchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Internal error'),
  404: z
    .object({ message: z.string() })
    .describe('Invite not found'),
  200: z
    .object({
      workspaceName: z.string(),
      inviterName: z.string().nullable(),
      role: z.string(),
      expiresAt: z.date(),
      expired: z.boolean(),
    })
    .describe('Invite info'),
}

export const acceptInviteParamsSchemaRequest = z.object({
  token: z.string().min(1),
})

export const acceptInviteSchemaResponse = {
  500: z
    .object({ message: z.string() })
    .describe('Internal error'),
  404: z
    .object({ message: z.string() })
    .describe('Invite not found'),
  403: z
    .object({ message: z.string() })
    .describe('Email mismatch or forbidden'),
  400: z
    .object({ message: z.string() })
    .describe('Invite expired or already used'),
  422: z
    .object({ message: z.string() })
    .describe('Already a member of this workspace'),
  200: z
    .object({
      workspaceId: z.string(),
      role: z.string(),
    })
    .describe('Invite accepted'),
}
