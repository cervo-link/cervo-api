import assert from 'node:assert'
import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { IdentityAlreadyLinked } from '@/domain/errors/identity-already-linked'
import { IdentityLinkedToDifferentMember } from '@/domain/errors/identity-linked-to-different-member'
import { findById } from '@/infra/db/repositories/members-repository'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeMember, makeShadowMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { linkMemberIdentity } from './link-member-identity-service'

describe('linkMemberIdentity', () => {
	it('should create a new identity when none exists', async () => {
		const member = await makeMember()

		const result = await linkMemberIdentity({
			realMemberId: member.id,
			provider: 'discord',
			providerUserId: `new-user-${Date.now()}`,
		})

		assert(!(result instanceof DomainError))
		expect(result.memberId).toBe(member.id)
		expect(result.provider).toBe('discord')
	})

	it('should return IdentityAlreadyLinked when identity is already linked to this member', async () => {
		const member = await makeMember()
		const providerUserId = `already-linked-${Date.now()}`
		await makeMemberPlatformIdentity({
			memberId: member.id,
			provider: 'discord',
			providerUserId,
		})

		const result = await linkMemberIdentity({
			realMemberId: member.id,
			provider: 'discord',
			providerUserId,
		})

		expect(result).toBeInstanceOf(IdentityAlreadyLinked)
	})

	it('should return IdentityLinkedToDifferentMember when identity belongs to a different real member', async () => {
		const real = await makeMember()
		const other = await makeMember({ userId: faker.string.uuid() })
		const providerUserId = `other-real-${Date.now()}`
		await makeMemberPlatformIdentity({
			memberId: other.id,
			provider: 'discord',
			providerUserId,
		})

		const result = await linkMemberIdentity({
			realMemberId: real.id,
			provider: 'discord',
			providerUserId,
		})

		expect(result).toBeInstanceOf(IdentityLinkedToDifferentMember)
	})

	it('should merge shadow member and create identity when shadow exists for providerUserId', async () => {
		const real = await makeMember()
		const shadow = await makeShadowMember()
		const workspace = await makeWorkspace({ ownerId: real.id })
		const providerUserId = `shadow-user-${Date.now()}`

		await makeMemberPlatformIdentity({
			memberId: shadow.id,
			provider: 'discord',
			providerUserId,
		})
		await makeBookmark({ workspaceId: workspace.id, memberId: shadow.id })
		await makeMembership(workspace.id, shadow.id)

		const result = await linkMemberIdentity({
			realMemberId: real.id,
			provider: 'discord',
			providerUserId,
		})

		assert(!(result instanceof DomainError))
		expect(result.memberId).toBe(real.id)

		const deletedShadow = await findById(shadow.id)
		expect(deletedShadow).toBeNull()
	})

	it('should preserve shadow bookmarks under real member after merge', async () => {
		const real = await makeMember()
		const shadow = await makeMember({ email: null, username: null, userId: null })
		const workspace = await makeWorkspace({ ownerId: real.id })
		const providerUserId = `shadow-bm-${Date.now()}`

		await makeMemberPlatformIdentity({
			memberId: shadow.id,
			provider: 'discord',
			providerUserId,
		})
		await makeBookmark({ workspaceId: workspace.id, memberId: shadow.id })

		await linkMemberIdentity({
			realMemberId: real.id,
			provider: 'discord',
			providerUserId,
		})

		const deletedShadow = await findById(shadow.id)
		expect(deletedShadow).toBeNull()
	})
})
