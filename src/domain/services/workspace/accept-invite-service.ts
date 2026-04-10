import type { Membership } from '@/domain/entities/membership'
import { DomainError } from '@/domain/errors/domain-error'
import { InviteAlreadyUsed } from '@/domain/errors/invite-already-used'
import { InviteEmailMismatch } from '@/domain/errors/invite-email-mismatch'
import { InviteExpired } from '@/domain/errors/invite-expired'
import { InviteNotFound } from '@/domain/errors/invite-not-found'
import { insertMembership } from '@/infra/db/repositories/membership-repository'
import {
  findByToken,
  markInviteAsUsed,
} from '@/infra/db/repositories/workspace-invites-repository'
import { withSpan } from '@/infra/utils/with-span'

export async function acceptInvite(
  token: string,
  memberId: string,
  memberEmail: string
): Promise<Membership | DomainError> {
  return withSpan('accept-invite', async () => {
    const invite = await findByToken(token)
    if (!invite) return new InviteNotFound()

    if (invite.usedAt) return new InviteAlreadyUsed()
    if (new Date() > invite.expiresAt) return new InviteExpired()

    if (invite.email.toLowerCase() !== memberEmail.toLowerCase()) {
      return new InviteEmailMismatch()
    }

    const membership = await insertMembership({
      memberId,
      workspaceId: invite.workspaceId,
      role: invite.role,
    })

    if (membership instanceof DomainError) return membership

    await markInviteAsUsed(token, memberId)

    return membership
  })
}
