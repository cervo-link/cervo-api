import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { getWorkspace } from '@/domain/services/workspace/get-workspace-service'
import { logger } from '@/infra/logger'
import { withSpan } from '@/infra/utils/with-span'
import { findByMemberId } from '@/infra/db/repositories/workspaces-repository'
import { replyWithError } from '@/infra/http/utils/reply-with'
import {
  createWorkspaceBodySchemaRequest,
  getWorkspaceQuerySchemaRequest,
  getWorkspacesByMemberParamsSchema,
} from '../schemas/workspaces-schema'

export async function getMyWorkspacesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-my-workspaces', async () => {
    logger.info({ memberId: request.member.id }, '[getMyWorkspacesController] fetching workspaces')
    const workspaces = await findByMemberId(request.member.id)
    logger.info({ memberId: request.member.id, count: workspaces.length }, '[getMyWorkspacesController] workspaces found')
    return reply.status(200).send({ workspaces })
  })
}

export async function getWorkspacesByMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-workspaces-by-member', async () => {
    const { memberId } = getWorkspacesByMemberParamsSchema.parse(request.params)
    logger.info({ memberId }, '[getWorkspacesByMemberController] fetching workspaces')
    const workspaces = await findByMemberId(memberId)
    logger.info({ memberId, count: workspaces.length }, '[getWorkspacesByMemberController] workspaces found')
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
