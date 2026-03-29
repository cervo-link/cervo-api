import type { Member } from '@/domain/entities/member'
import type { DomainError } from '@/domain/errors/domain-error'
import {
	findMemberByProviderIdentity,
	insertMemberPlatformIdentityWithTransaction,
} from '@/infra/db/repositories/member-platform-identities-repository'
import { insertMemberWithTransaction } from '@/infra/db/repositories/members-repository'
import { executeTransaction } from '@/infra/db/utils/transactions'
import { withSpan } from '@/infra/utils/with-span'

export type ResolveOrCreateMemberInput = {
	provider: string
	providerUserId: string
	displayName: string
}

export async function resolveOrCreateMember(
	input: ResolveOrCreateMemberInput
): Promise<Member | DomainError> {
	return withSpan('resolve-or-create-member', async () => {
		const existing = await findMemberByProviderIdentity(
			input.provider,
			input.providerUserId
		)

		if (existing) return existing

		return executeTransaction(async tx => {
			const member = await insertMemberWithTransaction(tx, {
				name: input.displayName,
				email: null,
				username: null,
				userId: null,
			})

			if (member instanceof Error) return member

			const identity = await insertMemberPlatformIdentityWithTransaction(tx, {
				memberId: member.id,
				provider: input.provider,
				providerUserId: input.providerUserId,
			})

			if (identity instanceof Error) return identity

			return member
		})
	})
}
