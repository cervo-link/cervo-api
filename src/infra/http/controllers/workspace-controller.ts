import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { getWorkspace } from '@/domain/services/workspace/get-workspace-service'
import { withSpan } from '@/infra/utils/with-span'
import {
  createWorkspaceBodySchemaRequest,
  getWorkspaceQuerySchemaRequest,
} from '../schemas/workspaces-schema'

export async function createWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-workspace', async () => {
    const { name, description, ownerId } =
      createWorkspaceBodySchemaRequest.parse(request.body)

    const workspace = await createWorkspace({ name, description, ownerId })

    if (workspace instanceof DomainError) {
      return reply.status(workspace.status).send({ message: workspace.message })
    }

    return reply.status(201).send({ workspace })
  })
}

export async function getWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-workspace', async () => {
    const { id } = getWorkspaceQuerySchemaRequest.parse(request.query)

    const workspace = await getWorkspace(id)

    if (workspace instanceof DomainError) {
      return reply.status(workspace.status).send({ message: workspace.message })
    }

    return reply.status(200).send({ workspace })
  })
}
