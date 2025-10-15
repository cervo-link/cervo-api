import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { addMemberToWorkspace } from '@/domain/services/members/add-member-service'
import { createMember } from '@/domain/services/members/create-member-service'
import { hashPassword } from '@/infra/utils/password-hash'
import {
  addMemberToWorkspaceBodySchemaRequest,
  createMemberBodySchemaRequest,
} from '../schemas/members-schema'

export async function createMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { name, username, email, discordUserId, password } =
    createMemberBodySchemaRequest.parse(request.body)

  const hashedPassword = await hashPassword(password)

  const member = await createMember({
    name,
    username,
    email,
    discordUserId,
    passwordHash: hashedPassword,
  })

  if (member instanceof DomainError) {
    return reply.status(member.status).send({
      message: member.message,
    })
  }

  return reply.status(201).send({ member })
}

export async function addMemberToWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { workspaceId, memberId } = addMemberToWorkspaceBodySchemaRequest.parse(
    request.body
  )

  const result = await addMemberToWorkspace(memberId, workspaceId)

  if (result instanceof DomainError) {
    return reply.status(result.status).send({
      message: result.message,
    })
  }

  return reply.status(201).send({ message: 'Member invited to workspace.' })
}
