import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createMemberPlatformIdentity } from '@/domain/services/members/create-member-platform-identity-service'
import { findMemberByPlatform } from '@/domain/services/members/find-member-by-platform-service'
import { linkMemberIdentity } from '@/domain/services/members/link-member-identity-service'
import { findIdentitiesByMemberId } from '@/infra/db/repositories/member-platform-identities-repository'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { withSpan } from '@/infra/utils/with-span'
import {
  createMemberIdentityBodySchema,
  createMemberIdentityParamsSchema,
  findMemberByIdentityQuerySchema,
  linkMemberIdentityBodySchema,
} from '../schemas/members-schema'

export async function createMemberIdentityController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-member-identity', async () => {
    const { memberId } = createMemberIdentityParamsSchema.parse(request.params)
    const { provider, providerUserId } = createMemberIdentityBodySchema.parse(request.body)

    const result = await createMemberPlatformIdentity({ memberId, provider, providerUserId })

    if (result instanceof DomainError) return replyWithError(reply, result)

    return reply.status(201).send({ identity: result })
  })
}

export async function linkMemberIdentityController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('link-member-identity', async () => {
    const { provider, providerUserId } = linkMemberIdentityBodySchema.parse(request.body)

    const result = await linkMemberIdentity({
      realMemberId: request.member.id,
      provider,
      providerUserId,
    })

    if (result instanceof DomainError) return replyWithError(reply, result)

    return reply.status(201).send({ identity: result })
  })
}

export async function getMemberIdentitiesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const identities = await findIdentitiesByMemberId(request.member.id)
  return reply.status(200).send({ identities })
}

export async function findMemberByIdentityController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('find-member-by-identity', async () => {
    const { provider, providerUserId } = findMemberByIdentityQuerySchema.parse(request.query)

    const result = await findMemberByPlatform({ provider, providerUserId })

    if (result instanceof DomainError) return replyWithError(reply, result)

    return reply.status(200).send({ member: result })
  })
}
