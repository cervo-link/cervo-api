import { z } from 'zod'

export const addWorkspaceIntegrationBodySchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().optional(),
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
  providerName: z.string().nullable(),
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

export const getWorkspaceIntegrationsParamsSchema = z.object({
  workspaceId: z.string().uuid(),
})

export const getWorkspaceIntegrationsResponseSchema = {
  200: z
    .object({ integrations: z.array(integrationSchema) })
    .describe('Integrations found'),
  403: z.object({ message: z.string() }).describe('Forbidden'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
}

export const deleteWorkspaceIntegrationParamsSchema = z.object({
  workspaceId: z.string().uuid(),
  integrationId: z.string().uuid(),
})

export const deleteWorkspaceIntegrationResponseSchema = {
  204: z.undefined().describe('Integration deleted'),
  403: z.object({ message: z.string() }).describe('Forbidden'),
  404: z.object({ message: z.string() }).describe('Integration not found'),
}

export const deleteIntegrationByProviderQuerySchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
})

export const deleteIntegrationByProviderResponseSchema = {
  204: z.undefined().describe('Integration deleted'),
  404: z.object({ message: z.string() }).describe('Integration not found'),
}

export const getWorkspaceByIntegrationResponseSchema = {
  200: z.object({ workspace: workspaceSchema }).describe('Workspace found'),
  404: z.object({ message: z.string() }).describe('Workspace not found'),
}

export const patchIntegrationByProviderQuerySchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
})

export const patchIntegrationByProviderBodySchema = z.object({
  providerName: z.string().min(1),
})

export const patchIntegrationByProviderResponseSchema = {
  200: z.object({ integration: integrationSchema }).describe('Integration updated'),
  404: z.object({ message: z.string() }).describe('Integration not found'),
}
