import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { acceptInvite } from '@/domain/services/workspace/accept-invite-service'
import { createInvite } from '@/domain/services/workspace/create-invite-service'
import { getInviteInfo } from '@/domain/services/workspace/get-invite-service'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { withSpan } from '@/infra/utils/with-span'
import { config } from '@/config'
import {
  acceptInviteParamsSchemaRequest,
  createInviteBodySchemaRequest,
  createInviteParamsSchemaRequest,
  getInviteParamsSchemaRequest,
} from '../schemas/invite-schema'

export async function createInviteController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('create-invite-controller', async () => {
    const { workspaceId } = createInviteParamsSchemaRequest.parse(
      request.params
    )
    const { email, role, expiresInDays } =
      createInviteBodySchemaRequest.parse(request.body)

    const result = await createInvite(
      workspaceId,
      request.member.id,
      email,
      role,
      expiresInDays
    )

    if (result instanceof DomainError)
      return replyWithError(reply, result)

    const inviteUrl = `${config.betterAuth.FRONTEND_URL}/invite/${result.token}`

    return reply.status(201).send({
      token: result.token,
      inviteUrl,
      expiresAt: result.expiresAt,
    })
  })
}

export async function getInviteController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-invite-controller', async () => {
    const { token } = getInviteParamsSchemaRequest.parse(
      request.params
    )

    const result = await getInviteInfo(token)

    if (result instanceof DomainError)
      return replyWithError(reply, result)

    return reply.status(200).send(result)
  })
}

export async function acceptInviteController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('accept-invite-controller', async () => {
    const { token } = acceptInviteParamsSchemaRequest.parse(
      request.params
    )

    const result = await acceptInvite(
      token,
      request.member.id,
      request.member.email as string
    )

    if (result instanceof DomainError)
      return replyWithError(reply, result)

    return reply.status(200).send({
      workspaceId: result.workspaceId,
      role: result.role,
    })
  })
}
