import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspaceIntegration } from '@/domain/services/workspace-integrations/create-workspace-integration-service'
import { getWorkspaceByIntegration } from '@/domain/services/workspace-integrations/get-workspace-by-integration-service'
import { withSpan } from '@/infra/utils/with-span'
import type {
  addWorkspaceIntegrationBodySchema,
  addWorkspaceIntegrationParamsSchema,
  getWorkspaceByIntegrationQuerySchema,
} from '@/infra/http/schemas/workspace-integrations-schema'

export async function addWorkspaceIntegrationController(
  request: FastifyRequest<{
    Params: z.infer<typeof addWorkspaceIntegrationParamsSchema>
    Body: z.infer<typeof addWorkspaceIntegrationBodySchema>
  }>,
  reply: FastifyReply
) {
  return withSpan('add-workspace-integration', async () => {
    const { workspaceId } = request.params
    const { provider, providerId } = request.body

    const result = await createWorkspaceIntegration({ workspaceId, provider, providerId })

    if (result instanceof DomainError) {
      return reply.status(result.status).send({ message: result.message })
    }

    return reply.status(201).send({ integration: result })
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

    if (workspace instanceof DomainError) {
      return reply.status(workspace.status).send({ message: workspace.message })
    }

    return reply.status(200).send({ workspace })
  })
}
