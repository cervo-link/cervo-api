import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { joinWaitingList } from '@/domain/services/waiting-list/join-waiting-list-service'
import { replyWithError } from '@/infra/http/utils/reply-with'
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

    if (result instanceof DomainError) return replyWithError(reply, result)

    // null = already registered, both cases return 200/201 with ok response
    if (result === null) return reply.status(200).send({ message: 'ok' })

    return reply.status(201).send(result)
  })
}
