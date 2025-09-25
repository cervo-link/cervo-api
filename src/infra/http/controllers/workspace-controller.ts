import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { createWorkspaceBodySchemaRequest } from '../schemas/workspaces-schema'

export async function createWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { name, description, platform, platformId } =
    createWorkspaceBodySchemaRequest.parse(request.body)

  const workspace = await createWorkspace({
    name,
    description,
    platform,
    platformId,
  })

  if (workspace instanceof DomainError) {
    return reply.status(workspace.status).send({
      message: workspace.message,
    })
  }

  return reply.send(workspace)
}
