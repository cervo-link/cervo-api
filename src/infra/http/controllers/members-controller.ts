import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { addMemberToWorkspace } from '@/domain/services/members/add-member-service'
import { createMemberFromOAuth } from '@/domain/services/members/create-member-from-oauth-service'
import { createMember } from '@/domain/services/members/create-member-service'
import { auth } from '@/infra/auth'
import { findByUserId } from '@/infra/db/repositories/members-repository'
import { findByOwnerId } from '@/infra/db/repositories/workspaces-repository'
import { logger } from '@/infra/logger'
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

export async function syncMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('sync-member', async () => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!session) {
      return reply.status(401).send({ message: 'No active session.' })
    }

    logger.info({ userId: session.user.id }, '[syncMember] session resolved')

    const existing = await findByUserId(session.user.id)

    if (existing) {
      logger.info(
        { memberId: existing.id },
        '[syncMember] member already exists'
      )
      return reply.status(200).send({ member: existing })
    }

    logger.info(
      { userId: session.user.id },
      '[syncMember] member not found, creating'
    )

    const username = session.user.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')

    const result = await createMemberFromOAuth({
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username,
    })

    if (result instanceof DomainError) {
      logger.error(
        { message: result.message },
        '[syncMember] failed to create member'
      )
      return reply.status(result.status).send({ message: result.message })
    }

    logger.info({ memberId: result.id }, '[syncMember] member created')
    return reply.status(201).send({ member: result })
  })
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
