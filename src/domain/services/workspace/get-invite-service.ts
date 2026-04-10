import { DomainError } from '@/domain/errors/domain-error'
import {
  type InviteInfo,
  findInviteInfoByToken,
} from '@/infra/db/repositories/workspace-invites-repository'
import { withSpan } from '@/infra/utils/with-span'

export type PublicInviteInfo = InviteInfo & { expired: boolean }

export async function getInviteInfo(
  token: string
): Promise<PublicInviteInfo | DomainError> {
  return withSpan('get-invite-info', async () => {
    const invite = await findInviteInfoByToken(token)
    if (!invite) return new DomainError('Invite not found', 404)

    const expired =
      invite.usedAt !== null || new Date() > invite.expiresAt

    return { ...invite, expired }
  })
}
