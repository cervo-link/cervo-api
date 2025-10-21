import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { createWorkspaceBodySchemaRequest } from '../schemas/workspaces-schema'

export async function createWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('create-workspace')

  return tracer.startActiveSpan('create-workspace-controller', async span => {
    const { name, description, platform, platformId } =
      createWorkspaceBodySchemaRequest.parse(request.body)

    const workspace = await createWorkspace({
      name,
      description,
      platform,
      platformId,
    })

    if (workspace instanceof DomainError) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: workspace.message,
      })
      span.end()
      return reply.status(workspace.status).send({
        message: workspace.message,
      })
    }

    span.setStatus({
      code: SpanStatusCode.OK,
      message: 'Workspace created successfully',
    })
    span.end()

    return reply.status(201).send({ workspace })
  })
}
