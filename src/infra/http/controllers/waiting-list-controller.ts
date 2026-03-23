import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { EmailAlreadyOnWaitingList } from '@/domain/errors/email-already-on-waiting-list'
import { joinWaitingList } from '@/domain/services/waiting-list/join-waiting-list-service'
import { withSpan } from '@/infra/utils/with-span'
import { joinWaitingListBodySchemaRequest } from '../schemas/waiting-list-schema'

export async function joinWaitingListController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('join-waiting-list', async () => {
    const { email, allowPromoEmails } =
      joinWaitingListBodySchemaRequest.parse(request.body)

    const result = await joinWaitingList({ email, allowPromoEmails })

    if (result instanceof EmailAlreadyOnWaitingList) {
      return reply.status(200).send({ message: 'ok' })
    }

    if (result instanceof DomainError) {
      return reply.status(result.status).send({ message: result.message })
    }

    return reply.status(201).send(result)
  })
}
