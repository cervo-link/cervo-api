import type { Member } from '@/domain/entities/member'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { insertMember } from '@/infra/db/repositories/members-repository'
import { logger } from '@/infra/logger'
import { withSpan } from '@/infra/utils/with-span'

export async function createMemberFromOAuth(params: {
  userId: string
  name: string
  email: string
  username: string
}): Promise<Member | DomainError> {
  return withSpan('create-member-from-oauth', async () => {
    const member = await insertMember({
      userId: params.userId,
      name: params.name,
      email: params.email,
      username: params.username,
      active: true,
    })

    if (member instanceof DomainError) {
      logger.error({ message: member.message }, '[createMemberFromOAuth] insertMember failed')
      return member
    }

    logger.info({ memberId: member.id }, '[createMemberFromOAuth] member inserted')

    const workspace = await createWorkspace({
      name: 'Personal',
      ownerId: member.id,
      isPublic: false,
      isPersonal: true,
      active: true,
    })

    if (workspace instanceof DomainError) {
      logger.error({ memberId: member.id, message: workspace.message }, '[createMemberFromOAuth] createWorkspace failed')
    } else {
      logger.info({ workspaceId: workspace.id }, '[createMemberFromOAuth] Personal workspace created')
    }

    return member
  })
}
