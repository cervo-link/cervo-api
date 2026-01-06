import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { getWorkspace } from '@/domain/services/workspace/get-workspace-service'
import {
  createWorkspaceBodySchemaRequest,
  getWorkspaceQuerySchemaRequest,
} from '../schemas/workspaces-schema'

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

export async function getWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('get-workspace')

  return tracer.startActiveSpan('get-workspace-controller', async span => {
    const { platformId, platform } = getWorkspaceQuerySchemaRequest.parse(
      request.query
    )

    const workspace = await getWorkspace(platformId, platform)

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
      message: 'Workspace found successfully',
    })
    span.end()

    return reply.status(200).send({ workspace })
  })
}
