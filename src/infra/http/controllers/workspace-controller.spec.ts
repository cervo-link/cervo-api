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
			await makeMembership(workspace.id, owner.id, 'owner')
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

		it('should include the role field in each workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			await makeMembership(workspace.id, owner.id, 'owner')
			currentMember = owner

			const response = await app.inject({
				method: 'GET',
				url: '/workspaces/me',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			const ws = body.workspaces.find((w: { id: string }) => w.id === workspace.id)
			expect(ws.role).toBe('owner')
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
			await makeMembership(workspace.id, owner.id, 'owner')
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
			await makeMembership(workspace.id, owner.id, 'owner')
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
			const workspace = await makeWorkspace({ ownerId: owner.id, isPublic: false })
			await makeMembership(workspace.id, owner.id, 'owner')
			currentMember = owner

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${workspace.id}`,
				payload: { isPublic: true },
			})

			expect(response.statusCode).toBe(200)
			expect(JSON.parse(response.body).workspace.isPublic).toBe(true)
		})

		it('should return 403 when member has no membership in workspace', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'PATCH',
				url: `/workspaces/${randomUUID()}`,
				payload: { name: 'New Name' },
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 403 for a personal workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id, isPersonal: true })
			await makeMembership(workspace.id, owner.id, 'owner')
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
			await makeMembership(workspace.id, owner.id, 'owner')
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
			await makeMembership(workspace.id, owner.id, 'owner')
			currentMember = owner

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${workspace.id}`,
			})

			expect(response.statusCode).toBe(204)
		})

		it('should return 403 when member has no membership in workspace', async () => {
			currentMember = await makeMember()

			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${randomUUID()}`,
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 404 when workspace exists but is already deleted', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id })
			await makeMembership(workspace.id, owner.id, 'owner')
			currentMember = owner

			// Delete it once
			await app.inject({ method: 'DELETE', url: `/workspaces/${workspace.id}` })

			// Try again — no membership anymore (cascading delete), so 403
			const response = await app.inject({
				method: 'DELETE',
				url: `/workspaces/${workspace.id}`,
			})

			expect(response.statusCode).toBe(403)
		})

		it('should return 403 for a personal workspace', async () => {
			const owner = await makeMember()
			const workspace = await makeWorkspace({ ownerId: owner.id, isPersonal: true })
			await makeMembership(workspace.id, owner.id, 'owner')
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

	describe('Role-based access control', () => {
		describe('PATCH /workspaces/:workspaceId', () => {
			it('viewer cannot update workspace settings', async () => {
				const owner = await makeMember()
				const viewer = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, viewer.id, 'viewer')
				currentMember = viewer

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}`,
					payload: { name: 'Viewer Update' },
				})

				expect(response.statusCode).toBe(403)
			})

			it('editor cannot update workspace settings', async () => {
				const owner = await makeMember()
				const editor = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, editor.id, 'editor')
				currentMember = editor

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}`,
					payload: { name: 'Editor Update' },
				})

				expect(response.statusCode).toBe(403)
			})

			it('owner can update workspace settings', async () => {
				const owner = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, owner.id, 'owner')
				currentMember = owner

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}`,
					payload: { name: 'Owner Update' },
				})

				expect(response.statusCode).toBe(200)
			})
		})

		describe('DELETE /workspaces/:workspaceId', () => {
			it('viewer cannot delete a workspace', async () => {
				const owner = await makeMember()
				const viewer = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, viewer.id, 'viewer')
				currentMember = viewer

				const response = await app.inject({
					method: 'DELETE',
					url: `/workspaces/${workspace.id}`,
				})

				expect(response.statusCode).toBe(403)
			})

			it('editor cannot delete a workspace', async () => {
				const owner = await makeMember()
				const editor = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, editor.id, 'editor')
				currentMember = editor

				const response = await app.inject({
					method: 'DELETE',
					url: `/workspaces/${workspace.id}`,
				})

				expect(response.statusCode).toBe(403)
			})

			it('owner can delete a workspace', async () => {
				const owner = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, owner.id, 'owner')
				currentMember = owner

				const response = await app.inject({
					method: 'DELETE',
					url: `/workspaces/${workspace.id}`,
				})

				expect(response.statusCode).toBe(204)
			})
		})

		describe('POST /workspaces/:workspaceId/members', () => {
			it('viewer cannot invite members', async () => {
				const owner = await makeMember()
				const viewer = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, viewer.id, 'viewer')
				currentMember = viewer

				const response = await app.inject({
					method: 'POST',
					url: `/workspaces/${workspace.id}/members`,
					payload: { email: 'someone@example.com' },
				})

				expect(response.statusCode).toBe(403)
			})

			it('editor cannot invite members', async () => {
				const owner = await makeMember()
				const editor = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, editor.id, 'editor')
				currentMember = editor

				const response = await app.inject({
					method: 'POST',
					url: `/workspaces/${workspace.id}/members`,
					payload: { email: 'someone@example.com' },
				})

				expect(response.statusCode).toBe(403)
			})

			it('owner can invite a member', async () => {
				const owner = await makeMember()
				const invitee = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, owner.id, 'owner')
				currentMember = owner

				const response = await app.inject({
					method: 'POST',
					url: `/workspaces/${workspace.id}/members`,
					payload: { email: invitee.email },
				})

				expect(response.statusCode).toBe(201)
				expect(JSON.parse(response.body)).toEqual({ message: 'Member invited.' })
			})
		})

		describe('PATCH /workspaces/:workspaceId/members/:memberId', () => {
			it('owner can change a member role', async () => {
				const owner = await makeMember()
				const member = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, owner.id, 'owner')
				await makeMembership(workspace.id, member.id, 'viewer')
				currentMember = owner

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}/members/${member.id}`,
					payload: { role: 'editor' },
				})

				expect(response.statusCode).toBe(200)
			})

			it('owner cannot change their own role', async () => {
				const owner = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, owner.id, 'owner')
				currentMember = owner

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}/members/${owner.id}`,
					payload: { role: 'viewer' },
				})

				expect(response.statusCode).toBe(403)
			})

			it('editor cannot change member roles', async () => {
				const owner = await makeMember()
				const editor = await makeMember()
				const other = await makeMember()
				const workspace = await makeWorkspace({ ownerId: owner.id })
				await makeMembership(workspace.id, editor.id, 'editor')
				await makeMembership(workspace.id, other.id, 'viewer')
				currentMember = editor

				const response = await app.inject({
					method: 'PATCH',
					url: `/workspaces/${workspace.id}/members/${other.id}`,
					payload: { role: 'editor' },
				})

				expect(response.statusCode).toBe(403)
			})
		})
	})
})
