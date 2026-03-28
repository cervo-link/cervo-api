import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { deleteWorkspace } from '@/domain/services/workspace/delete-workspace-service'
import { getWorkspace } from '@/domain/services/workspace/get-workspace-service'
import { withSpan } from '@/infra/utils/with-span'
import { findByMemberId } from '@/infra/db/repositories/workspaces-repository'
import { replyWithError } from '@/infra/http/utils/reply-with'
import {
  createWorkspaceBodySchemaRequest,
  deleteWorkspaceParamsSchemaRequest,
  getWorkspaceQuerySchemaRequest,
} from '../schemas/workspaces-schema'

export async function getMyWorkspacesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-my-workspaces', async () => {
    const workspaces = await findByMemberId(request.member.id)
    return reply.status(200).send({ workspaces })
  })
}

export async function createWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-workspace', async () => {
    const { name, description, ownerId } =
      createWorkspaceBodySchemaRequest.parse(request.body)

    const workspace = await createWorkspace({ name, description, ownerId })

    if (workspace instanceof DomainError) return replyWithError(reply, workspace)

    return reply.status(201).send({ workspace })
  })
}

export async function deleteWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('delete-workspace', async () => {
    const { workspaceId } = deleteWorkspaceParamsSchemaRequest.parse(
      request.params
    )

    const error = await deleteWorkspace(workspaceId, request.member.id)

    if (error instanceof DomainError) return replyWithError(reply, error)

    return reply.status(204).send()
  })
}

export async function getWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-workspace', async () => {
    const { id } = getWorkspaceQuerySchemaRequest.parse(request.query)

    const workspace = await getWorkspace(id)

    if (workspace instanceof DomainError) return replyWithError(reply, workspace)

    return reply.status(200).send({ workspace })
  })
}
