import { insertMembership } from '@/infra/db/repositories/membership-repository'

export async function makeMembership(workspaceId: string, memberId: string) {
  return insertMembership({ workspaceId, memberId })
}
