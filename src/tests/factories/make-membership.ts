import { insertMembership } from '@/infra/db/repositories/membership-repository'

export async function makeMembership(workspaceId: string, memberId: string) {
  const membership = await insertMembership({
    workspaceId,
    memberId,
  })

  return membership
}
