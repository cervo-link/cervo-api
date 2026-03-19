import { trace } from '@opentelemetry/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createMemberPlatformIdentity } from '@/domain/services/members/create-member-platform-identity-service'
import { findMemberByPlatform } from '@/domain/services/members/find-member-by-platform-service'
import {
  createMemberIdentityBodySchema,
  createMemberIdentityParamsSchema,
  findMemberByIdentityQuerySchema,
} from '../schemas/members-schema'

export async function createMemberIdentityController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('create-member-identity')

  return tracer.startActiveSpan('create-member-identity-controller', async span => {
    const { memberId } = createMemberIdentityParamsSchema.parse(request.params)
    const { provider, providerUserId } = createMemberIdentityBodySchema.parse(request.body)

    const result = await createMemberPlatformIdentity({ memberId, provider, providerUserId })

    if (result instanceof DomainError) {
      span.end()
      return reply.status(result.status).send({ message: result.message })
    }

    span.end()
    return reply.status(201).send({ identity: result })
  })
}

export async function findMemberByIdentityController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tracer = trace.getTracer('find-member-by-identity')

  return tracer.startActiveSpan('find-member-by-identity-controller', async span => {
    const { provider, providerUserId } = findMemberByIdentityQuerySchema.parse(request.query)

    const result = await findMemberByPlatform({ provider, providerUserId })

    if (result instanceof DomainError) {
      span.end()
      return reply.status(result.status).send({ message: result.message })
    }

    span.end()
    return reply.status(200).send({ member: result })
  })
}
