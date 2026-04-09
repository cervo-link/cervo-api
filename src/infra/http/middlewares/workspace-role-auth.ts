import type { FastifyReply, FastifyRequest } from 'fastify'
import { defineAbilitiesFor } from '@/lib/abilities'
import { findMembershipRole } from '@/infra/db/repositories/membership-repository'

export function requireAbility(action: string, subject: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = request.params as { workspaceId: string }

    const role = await findMembershipRole(workspaceId, request.member.id)
    const ability = defineAbilitiesFor(role)

    if (ability.cannot(action as never, subject as never)) {
      return reply
        .code(403)
        .send({ message: `Requires ability to ${action} ${subject}` })
    }

    request.memberRole = role ?? undefined
  }
}
