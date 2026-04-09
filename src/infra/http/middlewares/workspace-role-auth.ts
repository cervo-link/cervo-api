import type { FastifyReply, FastifyRequest } from 'fastify'
import { findMembershipRole } from '@/infra/db/repositories/membership-repository'
import { defineAbilitiesFor } from '@/lib/abilities'
import { validateUuid } from '@/utils/validate-uuid'

export function requireAbility(action: string, subject: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = request.params as { workspaceId: string }

    if (!validateUuid(workspaceId)) {
      return reply
        .code(400)
        .send({ message: 'workspaceId must be a valid UUID' })
    }

    const role = await findMembershipRole(workspaceId, request.member.id)
    const ability = defineAbilitiesFor(role)

    if (ability.cannot(action, subject)) {
      return reply
        .code(403)
        .send({ message: `Requires ability to ${action} ${subject}` })
    }
  }
}
