import type { FastifyReply } from 'fastify'
import type { DomainError } from '@/domain/errors/domain-error'

export function replyWithError(reply: FastifyReply, error: DomainError) {
  return reply.status(error.status).send({ message: error.message })
}
