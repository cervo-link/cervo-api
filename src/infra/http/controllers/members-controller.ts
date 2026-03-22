import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { addMemberToWorkspace } from '@/domain/services/members/add-member-service'
import { createMember } from '@/domain/services/members/create-member-service'
import { findByOwnerId } from '@/infra/db/repositories/workspaces-repository'
import { withSpan } from '@/infra/utils/with-span'
import {
  addMemberToWorkspaceBodySchemaRequest,
  createMemberBodySchemaRequest,
} from '../schemas/members-schema'

export async function createMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-member', async () => {
    const { name, username, email } = createMemberBodySchemaRequest.parse(
      request.body
    )

    const member = await createMember({ name, username, email })

    if (member instanceof DomainError) {
      return reply.status(member.status).send({ message: member.message })
    }

    return reply.status(201).send({ member })
  })
}

export async function getMeController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const workspace = await findByOwnerId(request.member.id)
  return reply
    .status(200)
    .send({ member: request.member, workspace: workspace ?? null })
}

export async function addMemberToWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('add-member-to-workspace', async () => {
    const { workspaceId, memberId } =
      addMemberToWorkspaceBodySchemaRequest.parse(request.body)

    const result = await addMemberToWorkspace(memberId, workspaceId)

    if (result instanceof DomainError) {
      return reply.status(result.status).send({ message: result.message })
    }

    return reply.status(201).send({ message: 'Member invited to workspace.' })
  })
}
