import { and, eq, inArray } from 'drizzle-orm'
import type { DomainError } from '@/domain/errors/domain-error'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { NotAShadowMember } from '@/domain/errors/not-a-shadow-member'
import { findById } from '@/infra/db/repositories/members-repository'
import { schema } from '@/infra/db/schema'
import type { Transaction } from '@/infra/db/utils/transactions'
import { executeTransaction } from '@/infra/db/utils/transactions'
import { withSpan } from '@/infra/utils/with-span'

export async function mergeMembersInTransaction(
	tx: Transaction,
	shadowMemberId: string,
	realMemberId: string
): Promise<DomainError | null> {
	// Delete shadow memberships that would conflict with real member's existing ones
	const realWorkspaces = await tx
		.select({ workspaceId: schema.memberships.workspaceId })
		.from(schema.memberships)
		.where(eq(schema.memberships.memberId, realMemberId))

	const conflictingIds = realWorkspaces.map(r => r.workspaceId)

	if (conflictingIds.length > 0) {
		await tx
			.delete(schema.memberships)
			.where(
				and(
					eq(schema.memberships.memberId, shadowMemberId),
					inArray(schema.memberships.workspaceId, conflictingIds)
				)
			)
	}

	// Transfer remaining memberships to real member
	await tx
		.update(schema.memberships)
		.set({ memberId: realMemberId })
		.where(eq(schema.memberships.memberId, shadowMemberId))

	// Transfer bookmarks to real member
	await tx
		.update(schema.bookmarks)
		.set({ memberId: realMemberId, updatedAt: new Date() })
		.where(eq(schema.bookmarks.memberId, shadowMemberId))

	// Delete shadow member's identities
	await tx
		.delete(schema.memberPlatformIdentities)
		.where(eq(schema.memberPlatformIdentities.memberId, shadowMemberId))

	// Delete shadow member
	await tx.delete(schema.members).where(eq(schema.members.id, shadowMemberId))

	return null
}

export async function mergeMembers(
	shadowMemberId: string,
	realMemberId: string
): Promise<DomainError | null> {
	return withSpan('merge-members', async () => {
		const shadowMember = await findById(shadowMemberId)
		if (!shadowMember) return new MemberNotFound()
		if (shadowMember.userId !== null) return new NotAShadowMember()

		const realMember = await findById(realMemberId)
		if (!realMember) return new MemberNotFound()

		return executeTransaction(tx =>
			mergeMembersInTransaction(tx, shadowMemberId, realMemberId)
		)
	})
}
