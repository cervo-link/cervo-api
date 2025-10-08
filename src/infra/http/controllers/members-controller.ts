import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createMember } from '@/domain/services/members/create-member-service'
import { hashPassword } from '@/infra/utils/password-hash'
import { createMemberBodySchemaRequest } from '../schemas/members-schema'

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
