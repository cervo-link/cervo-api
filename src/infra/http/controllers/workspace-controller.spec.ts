import { randomUUID } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '@/domain/entities/member'
import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const API_KEY = 'test-api-key-for-testing'

let currentMember: Member

vi.mock('@/infra/http/middlewares/session-auth', () => ({
	sessionAuth: vi.fn(async (request: FastifyRequest) => {
		request.member = currentMember
	}),
}))

describe('WorkspaceController', () => {
	describe('GET /workspaces/me', () => {
		it('should return all workspaces for the authenticated member', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			await makeMembership(workspace.id, owner.id)
			currentMember = owner

			const response = await app.inject({
				method: 'GET',
				url: '/workspaces/me',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.workspaces).toBeInstanceOf(Array)
			expect(
				body.workspaces.some((w: { id: string }) => w.id === workspace.id)
			).toBe(true)
		})

		it('should return empty array when member has no workspaces', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'GET',
				url: '/workspaces/me',
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspaces).toEqual([])
		})
	})

	describe('POST /workspaces/create', () => {
		it('should be able to create a workspace', async () => {
			const owner = await makeMember()

			const payload = {
				name: 'My Workspace',
				description: 'A test workspace',
				ownerId: owner.id,
			}

			const response = await app.inject({
				method: 'POST',
				url: '/workspaces/create',
				headers: { authorization: `Bearer ${API_KEY}` },
				payload,
			})

			expect(response.statusCode).toBe(201)
			expect(JSON.parse(response.body)).toEqual({
				workspace: {
					id: expect.any(String),
					ownerId: owner.id,
					name: payload.name,
					description: payload.description,
					isPublic: false,
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
					active: true,
				},
			})
		})
	})

	describe('GET /workspaces', () => {
		it('should be able to get a workspace by id', async () => {
			const workspace = await makeWorkspace()

			const response = await app.inject({
				method: 'GET',
				url: `/workspaces?id=${workspace.id}`,
				headers: { authorization: `Bearer ${API_KEY}` },
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body)).toEqual({
				workspace: {
					id: workspace.id,
					ownerId: workspace.ownerId,
					name: workspace.name,
					description: workspace.description,
					isPublic: workspace.isPublic,
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
					active: true,
				},
			})
		})

		it('should return 404 when workspace is not found', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/workspaces?id=00000000-0000-0000-0000-000000000000',
				headers: { authorization: `Bearer ${API_KEY}` },
			})

			expect(response.statusCode).toBe(404)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Workspace not found',
			})
		})
	})

	describe('PATCH /workspaces/:workspaceId', () => {
		it('should update workspace name', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { name: 'Updated Name' },
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspace.name).toBe('Updated Name')
		})

		it('should update workspace description', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { description: 'New description' },
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspace.description).toBe(
				'New description'
			)
		})

		it('should update workspace visibility', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({
				ownerId: owner.id,
				isPublic: false,
			})
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { isPublic: true },
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspace.isPublic).toBe(true)
		})

		it('should return 404 when workspace does not exist', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${randomUUID()}`,
				payload: { name: 'New Name' },
			})

			expect(response.statusCode).toBe(404)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Workspace not found',
			})
		})

		it('should return 403 when requester is not the owner', async () => {
			const owner = await makeMember()
			const other = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = other

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { name: 'Hijacked' },
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 403 for a personal workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({
				ownerId: owner.id,
				isPersonal: true,
			})
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { name: 'New Name' },
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 400 when body is empty', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: {},
			})

			expect(response.statusCode).toBe(400)
		})

		it('should return 400 when workspaceId is not a valid UUID', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'PATCH',
				url: '/workspaces/not-a-uuid',
				payload: { name: 'New Name' },
			})

			expect(response.statusCode).toBe(400)
		})
	})

	describe('DELETE /workspaces/:workspaceId', () => {
		it('should delete a workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = owner

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${workspace.id}`,
			})

			expect(response.statusCode).toBe(204)
		})

		it('should return 404 when workspace does not exist', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${randomUUID()}`,
			})

			expect(response.statusCode).toBe(404)
			expect(JSON.parse(response.body)).toEqual({
				message: 'Workspace not found',
			})
		})

		it('should return 403 when requester is not the owner', async () => {
			const owner = await makeMember()
			const other = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			currentMember = other

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${workspace.id}`,
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 403 for a personal workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({
				ownerId: owner.id,
				isPersonal: true,
			})
			currentMember = owner

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${workspace.id}`,
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 400 when workspaceId is not a valid UUID', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'DELETE',
				url: '/workspaces/not-a-uuid',
			})

			expect(response.statusCode).toBe(400)
		})
	})
})
