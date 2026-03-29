import { z } from 'zod'

export const addWorkspaceIntegrationBodySchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
})

export const addWorkspaceIntegrationParamsSchema = z.object({
  workspaceId: z.string().uuid(),
})

export const getWorkspaceByIntegrationQuerySchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
})

const workspaceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

const integrationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  provider: z.string(),
  providerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

export const addWorkspaceIntegrationResponseSchema = {
  201: z.object({ integration: integrationSchema }).describe('Integration added'),
  403: z.object({ message: z.string() }).describe('Forbidden'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
  422: z.object({ message: z.string() }).describe('Integration already exists'),
}

export const getWorkspaceByIntegrationResponseSchema = {
  200: z.object({ workspace: workspaceSchema }).describe('Workspace found'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
}
