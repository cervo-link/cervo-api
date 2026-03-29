import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspaceIntegration } from '@/domain/services/workspace-integrations/create-workspace-integration-service'
import { getWorkspaceByIntegration } from '@/domain/services/workspace-integrations/get-workspace-by-integration-service'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import {
  deleteIntegrationByProvider,
  deleteIntegrationById,
  findIntegrationsByWorkspaceId,
} from '@/infra/db/repositories/workspace-integrations-repository'
import type {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  deleteIntegrationByProviderQuerySchema,
  deleteWorkspaceIntegrationParamsSchema,
  getWorkspaceByIntegrationQuerySchema,
  getWorkspaceIntegrationsParamsSchema,
} from '@/infra/http/schemas/workspace-integrations-schema'
import { replyWithError } from '@/infra/http/utils/reply-with'
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

    if (request.member) {
      const workspace = await findById(workspaceId)
      if (!workspace) {
        return reply.status(404).send({ message: 'Workspace not found' })
      }
      if (workspace.ownerId !== request.member.id) {
        return reply.status(403).send({ message: 'Forbidden' })
      }
    }

    const result = await createWorkspaceIntegration({
      workspaceId,
      provider,
      providerId,
      providerName,
    })

    if (result instanceof DomainError) return replyWithError(reply, result)

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

    if (request.member) {
      const workspace = await findById(workspaceId)
      if (!workspace) {
        return reply.status(404).send({ message: 'Workspace not found' })
      }
      if (workspace.ownerId !== request.member.id) {
        return reply.status(403).send({ message: 'Forbidden' })
      }
    }

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

    if (request.member) {
      const workspace = await findById(workspaceId)
      if (!workspace) {
        return reply.status(404).send({ message: 'Workspace not found' })
      }
      if (workspace.ownerId !== request.member.id) {
        return reply.status(403).send({ message: 'Forbidden' })
      }
    }

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
