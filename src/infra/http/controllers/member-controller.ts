import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createMember } from '@/domain/services/members/create-member-service'
import { createMemberBodySchemaRequest } from '../schemas/members-schema'

export async function createMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { name, username, email, discordUserId } =
    createMemberBodySchemaRequest.parse(request.body)

  const member = await createMember({
    name,
    username,
    email,
    discordUserId,
  })

  if (member instanceof DomainError) {
    return reply.status(member.status).send({
      message: member.message,
    })
  }

  return reply.send(member)
}
