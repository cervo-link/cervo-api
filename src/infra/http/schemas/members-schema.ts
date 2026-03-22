import { z } from 'zod'

const memberResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

const identityResponseSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  provider: z.string(),
  providerUserId: z.string(),
  createdAt: z.date(),
})

export const createMemberBodySchemaRequest = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  username: z.string().min(1, 'Username must not be empty'),
  email: z.string().email('Email must be a valid email'),
})

export const createMemberBodySchemaResponse = {
  500: z.object({ message: z.string() }).describe('Failed to create member'),
  400: z.object({ message: z.string() }).describe('Failed to create member'),
  422: z.object({ message: z.string() }).describe('Member already exists'),
  201: z.object({ member: memberResponseSchema }).describe('Member created.'),
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

export const createMemberIdentityParamsSchema = z.object({
  memberId: z.string().uuid('Member ID must be a valid UUID'),
})

export const createMemberIdentityBodySchema = z.object({
  provider: z.string().min(1, 'Provider must not be empty'),
  providerUserId: z.string().min(1, 'Provider user ID must not be empty'),
})

export const createMemberIdentityResponseSchema = {
  201: z
    .object({ identity: identityResponseSchema })
    .describe('Identity linked'),
  404: z.object({ message: z.string() }).describe('Member not found'),
  422: z.object({ message: z.string() }).describe('Identity already exists'),
}

export const findMemberByIdentityQuerySchema = z.object({
  provider: z.string().min(1, 'Provider must not be empty'),
  providerUserId: z.string().min(1, 'Provider user ID must not be empty'),
})

export const findMemberByIdentityResponseSchema = {
  200: z.object({ member: memberResponseSchema }).describe('Member found'),
  404: z.object({ message: z.string() }).describe('Member not found'),
}

const workspaceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

export const getMeResponseSchema = {
  200: z
    .object({
      member: memberResponseSchema,
      workspace: workspaceResponseSchema.nullable(),
    })
    .describe('Current member'),
  401: z.object({ message: z.string() }).describe('Unauthorized'),
}
