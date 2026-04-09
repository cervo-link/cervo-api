import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspaceIntegration } from '@/domain/services/workspace-integrations/create-workspace-integration-service'
import { getWorkspaceByIntegration } from '@/domain/services/workspace-integrations/get-workspace-by-integration-service'
import {
  deleteIntegrationById,
  deleteIntegrationByProvider,
  findIntegrationsByWorkspaceId,
  updateIntegrationProviderName,
} from '@/infra/db/repositories/workspace-integrations-repository'
import type {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  deleteIntegrationByProviderQuerySchema,
  deleteWorkspaceIntegrationParamsSchema,
  getWorkspaceByIntegrationQuerySchema,
  getWorkspaceIntegrationsParamsSchema,
  patchIntegrationByProviderBodySchema,
  patchIntegrationByProviderQuerySchema,
} from '@/infra/http/schemas/workspace-integrations-schema'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { logger } from '@/infra/logger'
import { withSpan } from '@/infra/utils/with-span'

export async function addWorkspaceIntegrationController(
  request: FastifyRequest<{
    Params: z.infer<typeof addWorkspaceIntegrationParamsSchema>
    Body: z.infer<typeof addWorkspaceIntegrationBodySchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('add-workspace-integration', async () => {
    const { workspaceId } = request.params
    const { provider, providerId, providerName } = request.body

    const result = await createWorkspaceIntegration({
      workspaceId,
      provider,
      providerId,
      providerName,
    })

    if (result instanceof DomainError) {
      logger.warn(
        { workspaceId, provider, providerId, error: result.message },
        'workspace integration failed'
      )
      return replyWithError(reply, result)
    }

    logger.info(
      { workspaceId, provider, providerId, integrationId: result.id },
      'workspace integration added'
    )
    return reply.status(201).send({ integration: result })
  })
}

export async function getWorkspaceIntegrationsController(
  request: FastifyRequest<{
    Params: z.infer<typeof getWorkspaceIntegrationsParamsSchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('get-workspace-integrations', async () => {
    const { workspaceId } = request.params

    const integrations = await findIntegrationsByWorkspaceId(workspaceId)
    return reply.status(200).send({ integrations })
  })
}

export async function deleteWorkspaceIntegrationController(
  request: FastifyRequest<{
    Params: z.infer<typeof deleteWorkspaceIntegrationParamsSchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('delete-workspace-integration', async () => {
    const { workspaceId, integrationId } = request.params

    const deleted = await deleteIntegrationById(integrationId, workspaceId)
    if (!deleted) {
      return reply.status(404).send({ message: 'Integration not found' })
    }
    return reply.status(204).send()
  })
}

export async function deleteIntegrationByProviderController(
  request: FastifyRequest<{
    Querystring: z.infer<typeof deleteIntegrationByProviderQuerySchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('delete-integration-by-provider', async () => {
    const { provider, providerId } = request.query

    const deleted = await deleteIntegrationByProvider(provider, providerId)
    if (!deleted) {
      return reply.status(404).send({ message: 'Integration not found' })
    }
    return reply.status(204).send()
  })
}

export async function getWorkspaceByIntegrationController(
  request: FastifyRequest<{
    Querystring: z.infer<typeof getWorkspaceByIntegrationQuerySchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('get-workspace-by-integration', async () => {
    const { provider, providerId } = request.query

    const workspace = await getWorkspaceByIntegration(provider, providerId)

    if (workspace instanceof DomainError)
      return replyWithError(reply, workspace)

    return reply.status(200).send({ workspace })
  })
}

export async function patchIntegrationByProviderController(
  request: FastifyRequest<{
    Querystring: z.infer<typeof patchIntegrationByProviderQuerySchema>
    Body: z.infer<typeof patchIntegrationByProviderBodySchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('patch-integration-by-provider', async () => {
    const { provider, providerId } = request.query
    const { providerName } = request.body

    const integration = await updateIntegrationProviderName(
      provider,
      providerId,
      providerName
    )

    if (!integration) {
      return reply.status(404).send({ message: 'Integration not found' })
    }

    return reply.status(200).send({ integration })
  })
}
