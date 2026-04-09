import { faker } from '@faker-js/faker'
import type { FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '@/domain/entities/member'
import app from '@/infra/http/app'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const API_KEY = 'test-api-key-for-testing'

let currentMember: Member

vi.mock('@/infra/http/middlewares/session-auth', () => ({
	sessionAuth: vi.fn(async (request: FastifyRequest) => {
		request.member = currentMember
	}),
}))

let mockSession: { user: { id: string; name: string; email: string } } | null =
	null

vi.mock('@/infra/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () => mockSession),
		},
	},
}))

describe('MembersController', () => {
	it('should be able to create a member', async () => {
		const member = makeRawMember()

		const payload = {
			name: member.name,
			username: member.username,
			email: member.email,
		}

		const response = await app.inject({
			method: 'POST',
			url: '/integrations/v1/members/create',
			headers: { authorization: `Bearer ${API_KEY}` },
			payload,
		})

		expect(response.statusCode).toBe(201)
		expect(JSON.parse(response.body)).toEqual({
			member: {
				id: expect.any(String),
				name: member.name,
				username: member.username,
				email: member.email,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				active: true,
			},
		})
	})

	it('should be able to return error username already exists', async () => {
		const member = await makeMember()

		const payload = {
			name: faker.person.fullName(),
			username: member.username,
			email: faker.internet.email(),
		}

		const response = await app.inject({
			method: 'POST',
			url: '/integrations/v1/members/create',
			headers: { authorization: `Bearer ${API_KEY}` },
			payload,
		})

		expect(response.statusCode).toBe(422)
		expect(JSON.parse(response.body)).toEqual({
			message: 'Cannot create duplicated member',
		})
	})

	it('should be able to return error email already exists', async () => {
		const member = await makeMember()

		const payload = {
			name: faker.person.fullName(),
			username: faker.internet.username(),
			email: member.email,
		}

		const response = await app.inject({
			method: 'POST',
			url: '/integrations/v1/members/create',
			headers: { authorization: `Bearer ${API_KEY}` },
			payload,
		})

		expect(response.statusCode).toBe(422)
		expect(JSON.parse(response.body)).toEqual({
			message: 'Cannot create duplicated member',
		})
	})

	describe('POST /members/resolve', () => {
		it('should return existing member when identity already exists', async () => {
			const member = await makeMember()
			const providerUserId = `known-user-${Date.now()}`
			await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: {
					provider: 'discord',
					providerUserId,
					displayName: member.name,
				},
			})

			const response = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: {
					provider: 'discord',
					providerUserId,
					displayName: 'Different Name',
				},
			})

			expect(response.statusCode).toBe(201)
			const body = JSON.parse(response.body)
			expect(body.member.id).toEqual(expect.any(String))
		})

		it('should create a shadow member when provider user is unknown', async () => {
			const providerUserId = `new-user-${Date.now()}`

			const response = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: {
					provider: 'discord',
					providerUserId,
					displayName: 'Brand New User',
				},
			})

			expect(response.statusCode).toBe(201)
			const body = JSON.parse(response.body)
			expect(body.member.id).toEqual(expect.any(String))
			expect(body.member.email).toBeNull()
		})

		it('should be idempotent — two calls return the same memberId', async () => {
			const providerUserId = `idempotent-http-${Date.now()}`
			const payload = {
				provider: 'discord',
				providerUserId,
				displayName: 'Same User',
			}

			const first = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload,
			})

			const second = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload,
			})

			expect(first.statusCode).toBe(201)
			expect(second.statusCode).toBe(201)
			expect(JSON.parse(first.body).member.id).toBe(
				JSON.parse(second.body).member.id
			)
		})

		it('should return 400 when required fields are missing', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { provider: 'discord' },
			})

			expect(response.statusCode).toBe(400)
		})

		it('should return 401 when API key is not provided', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/integrations/v1/members/resolve',
				payload: {
					provider: 'discord',
					providerUserId: 'some-user',
					displayName: 'Someone',
				},
			})

			expect(response.statusCode).toBe(401)
		})
	})

	describe('PUT /members/add', () => {
		it('should be able to add a member to a workspace', async () => {
			const member = await makeMember()
			const workspace = await makeWorkspace()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { memberId: member.id, workspaceId: workspace.id },
			})

			expect(response.statusCode).toBe(201)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Member invited to workspace.',
			})
		})

		it('should return 404 when workspace does not exist', async () => {
			const member = await makeMember()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { memberId: member.id, workspaceId: faker.string.uuid() },
			})

			expect(response.statusCode).toBe(404)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Workspace not found',
			})
		})

		it('should return 404 when member does not exist', async () => {
			const workspace = await makeWorkspace()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { memberId: faker.string.uuid(), workspaceId: workspace.id },
			})

			expect(response.statusCode).toBe(404)
			expect(JSON.parse(response.body)).toEqual({ message: 'Member not found' })
		})

		it('should return 422 when membership already exists', async () => {
			const member = await makeMember()
			const workspace = await makeWorkspace()
			await makeMembership(workspace.id, member.id)

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { memberId: member.id, workspaceId: workspace.id },
			})

			expect(response.statusCode).toBe(422)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Cannot create membership because it already exists',
			})
		})

		it('should return 400 when memberId is not provided', async () => {
			const workspace = await makeWorkspace()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { workspaceId: workspace.id },
			})

			expect(response.statusCode).toBe(400)
		})

		it('should return 400 when workspaceId is not provided', async () => {
			const member = await makeMember()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload: { memberId: member.id },
			})

			expect(response.statusCode).toBe(400)
		})

		it('should return 401 when API key is not provided', async () => {
			const member = await makeMember()
			const workspace = await makeWorkspace()

			const response = await app.inject({
				method: 'PUT',
				url: '/integrations/v1/members/add',
				payload: { memberId: member.id, workspaceId: workspace.id },
			})

			expect(response.statusCode).toBe(401)
		})
	})

	describe('GET /members/me', () => {
		it('should return the authenticated member with their workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = owner

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/members/me',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.member.id).toBe(owner.id)
			expect(body.workspace.id).toBe(workspace.id)
		})

		it('should return null workspace when member has no owned workspace', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/members/me',
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspace).toBeNull()
		})
	})

	describe('POST /members/sync', () => {
		it('should return existing member when session user already has a member record', async () => {
			const member = await makeMember({ userId: faker.string.uuid() })
			mockSession = {
				user: {
					id: member.userId as string,
					name: member.name as string,
					email: member.email as string,
				},
			}

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/members/sync',
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).member.id).toBe(member.id)
		})

		it('should create a new member when session user has no member record', async () => {
			mockSession = {
				user: {
					id: faker.string.uuid(),
					name: faker.person.fullName(),
					email: faker.internet.email(),
				},
			}

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/members/sync',
			})

			expect(response.statusCode).toBe(201)
			expect(JSON.parse(response.body).member.id).toEqual(expect.any(String))
		})

		it('should return 401 when there is no active session', async () => {
			mockSession = null

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/members/sync',
			})

			expect(response.statusCode).toBe(401)
			expect(JSON.parse(response.body)).toEqual({
				message: 'No active session.',
			})
		})
	})
})
