import crypto from 'node:crypto'
import type { WorkspaceInvite } from '@/domain/entities/workspace-invite'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspaceInvite } from '@/infra/db/repositories/workspace-invites-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'
import type { MembershipRole } from '@/infra/db/schema'
import { withSpan } from '@/infra/utils/with-span'

const MAX_EXPIRES_DAYS = 30
const DEFAULT_EXPIRES_DAYS = 7

export async function createInvite(
  workspaceId: string,
  createdBy: string,
  email: string,
  role: MembershipRole = 'viewer',
  expiresInDays = DEFAULT_EXPIRES_DAYS
): Promise<WorkspaceInvite | DomainError> {
  return withSpan('create-invite', async () => {
    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) return new DomainError('Workspace not found', 404)

    const days = Math.min(Math.max(1, expiresInDays), MAX_EXPIRES_DAYS)
    const expiresAt = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    )
    const token = crypto.randomBytes(32).toString('hex')

    return insertWorkspaceInvite({
      workspaceId,
      createdBy,
      email,
      token,
      role,
      expiresAt,
    })
  })
}
