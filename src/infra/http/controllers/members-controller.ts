import { trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { addMemberToWorkspace } from '@/domain/services/members/add-member-service'
import { createMember } from '@/domain/services/members/create-member-service'
import {
  addMemberToWorkspaceBodySchemaRequest,
  createMemberBodySchemaRequest,
} from '../schemas/members-schema'

export async function createMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('create-member')

  return tracer.startActiveSpan('create-member-controller', async span => {
    const { name, username, email } =
      createMemberBodySchemaRequest.parse(request.body)

    const member = await createMember({ name, username, email })

    if (member instanceof DomainError) {
      span.end()
      return reply.status(member.status).send({ message: member.message })
    }

    span.end()
    return reply.status(201).send({ member })
  })
}

export async function addMemberToWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('add-member-to-workspace')

  return tracer.startActiveSpan(
    'add-member-to-workspace-controller',
    async span => {
      const { workspaceId, memberId } =
        addMemberToWorkspaceBodySchemaRequest.parse(request.body)

      const result = await addMemberToWorkspace(memberId, workspaceId)

      if (result instanceof DomainError) {
        span.end()
        return reply.status(result.status).send({ message: result.message })
      }

      span.end()
      return reply.status(201).send({ message: 'Member invited to workspace.' })
    }
  )
}
