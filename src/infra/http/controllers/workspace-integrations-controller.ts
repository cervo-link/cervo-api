import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspaceIntegration } from '@/domain/services/workspace-integrations/create-workspace-integration-service'
import { getWorkspaceByIntegration } from '@/domain/services/workspace-integrations/get-workspace-by-integration-service'
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
  const tracer = trace.getTracer('add-workspace-integration')

  return tracer.startActiveSpan('add-workspace-integration-controller', async span => {
    const { workspaceId } = request.params
    const { provider, providerId } = request.body

    const result = await createWorkspaceIntegration({ workspaceId, provider, providerId })

    if (result instanceof DomainError) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: result.message })
      span.end()
      return reply.status(result.status).send({ message: result.message })
    }

    span.end()
    return reply.status(201).send({ integration: result })
  })
}

export async function getWorkspaceByIntegrationController(
  request: FastifyRequest<{
    Querystring: z.infer<typeof getWorkspaceByIntegrationQuerySchema>
  }>,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('get-workspace-by-integration')

  return tracer.startActiveSpan(
    'get-workspace-by-integration-controller',
    async span => {
      const { provider, providerId } = request.query

      const workspace = await getWorkspaceByIntegration(provider, providerId)

      if (workspace instanceof DomainError) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: workspace.message })
        span.end()
        return reply.status(workspace.status).send({ message: workspace.message })
      }

      span.end()
      return reply.status(200).send({ workspace })
    }
  )
}
