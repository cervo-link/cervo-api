import { trace } from '@opentelemetry/api'
import type { Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import {
  findByDiscordUserId,
  findById,
} from '@/infra/db/repositories/members-repository'

type FindMemberByPlatformInput = {
  platform: 'discord' | 'slack' | 'telegram'
  userId?: string
  discordId?: string
}

export async function findMemberByPlatform(
  params: FindMemberByPlatformInput
): Promise<Member | DomainError> {
  const tracer = trace.getTracer('find-member-by-platform')

  return tracer.startActiveSpan(
    'find-member-by-platform-service',
    async span => {
      let member: Member | null = null

      if (params.platform === 'discord') {
        if (!params.discordId) {
          span.end()
          return new MemberNotFound()
        }
        member = await findByDiscordUserId(params.discordId)
      } else {
        if (!params.userId) {
          span.end()
          return new MemberNotFound()
        }
        member = await findById(params.userId)
      }

      if (!member) {
        span.end()
        return new MemberNotFound()
      }

      span.end()
      return member
    }
  )
}
