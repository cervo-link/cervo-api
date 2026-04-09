import type { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '@/domain/errors/domain-error'
import { createWorkspace } from '@/domain/services/workspace/create-workspace-service'
import { deleteWorkspace } from '@/domain/services/workspace/delete-workspace-service'
import { getWorkspace } from '@/domain/services/workspace/get-workspace-service'
import { inviteMemberByEmail } from '@/domain/services/workspace/invite-member-service'
import { updateWorkspace } from '@/domain/services/workspace/update-workspace-service'
import { findByMemberId } from '@/infra/db/repositories/workspaces-repository'
import { logger } from '@/infra/logger'
import { replyWithError } from '@/infra/http/utils/reply-with'
import { withSpan } from '@/infra/utils/with-span'
import {
	changeMemberRoleBodySchemaRequest,
	changeMemberRoleParamsSchemaRequest,
	createWorkspaceBodySchemaRequest,
	deleteWorkspaceParamsSchemaRequest,
	getWorkspaceQuerySchemaRequest,
	getWorkspacesByMemberParamsSchema,
	inviteMemberBodySchemaRequest,
	inviteMemberParamsSchemaRequest,
	listMembersParamsSchemaRequest,
	removeMemberParamsSchemaRequest,
	updateWorkspaceBodySchemaRequest,
	updateWorkspaceParamsSchemaRequest,
} from '../schemas/workspaces-schema'
import {
	deleteMembership,
	listWorkspaceMembers,
	updateMembershipRole,
} from '@/infra/db/repositories/membership-repository'
import { findById as findWorkspaceById } from '@/infra/db/repositories/workspaces-repository'

export async function getMyWorkspacesController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('get-my-workspaces', async () => {
		const workspaces = await findByMemberId(request.member.id)
		return reply.status(200).send({ workspaces })
	})
}

export async function getWorkspacesByMemberController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return withSpan('get-workspaces-by-member', async () => {
    const { memberId } = getWorkspacesByMemberParamsSchema.parse(request.params)
    logger.info({ memberId }, '[getWorkspacesByMemberController] fetching workspaces')
    const workspaces = await findByMemberId(memberId)
    logger.info({ memberId, count: workspaces.length }, '[getWorkspacesByMemberController] workspaces found')
    return reply.status(200).send({ workspaces })
  })
}

export async function createWorkspaceController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('create-workspace', async () => {
		const { name, description, ownerId } =
			createWorkspaceBodySchemaRequest.parse(request.body)

		const workspace = await createWorkspace({ name, description, ownerId })

		if (workspace instanceof DomainError)
			return replyWithError(reply, workspace)

		return reply.status(201).send({ workspace })
	})
}

export async function updateWorkspaceController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('update-workspace', async () => {
		const { workspaceId } = updateWorkspaceParamsSchemaRequest.parse(
			request.params
		)
		const data = updateWorkspaceBodySchemaRequest.parse(request.body)

		const workspace = await updateWorkspace(workspaceId, data)

		if (workspace instanceof DomainError)
			return replyWithError(reply, workspace)

		return reply.status(200).send({ workspace })
	})
}

export async function deleteWorkspaceController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('delete-workspace', async () => {
		const { workspaceId } = deleteWorkspaceParamsSchemaRequest.parse(
			request.params
		)

		const error = await deleteWorkspace(workspaceId)

		if (error instanceof DomainError) return replyWithError(reply, error)

		return reply.status(204).send()
	})
}

export async function inviteMemberController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('invite-member', async () => {
		const { workspaceId } = inviteMemberParamsSchemaRequest.parse(
			request.params
		)
		const { email, role } = inviteMemberBodySchemaRequest.parse(request.body)

		const result = await inviteMemberByEmail(workspaceId, email, role)

		if (result instanceof DomainError) return replyWithError(reply, result)

		return reply.status(201).send({ message: 'Member invited.' })
	})
}

export async function changeMemberRoleController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('change-member-role', async () => {
		const { workspaceId, memberId } = changeMemberRoleParamsSchemaRequest.parse(
			request.params
		)
		const { role } = changeMemberRoleBodySchemaRequest.parse(request.body)

		if (memberId === request.member.id) {
			return reply
				.status(403)
				.send({ message: 'You cannot change your own role' })
		}

		const result = await updateMembershipRole(workspaceId, memberId, role)
		if (!result) {
			return reply.status(404).send({ message: 'Membership not found' })
		}

		return reply.status(200).send({ message: 'Role updated.' })
	})
}

export async function listWorkspaceMembersController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('list-workspace-members', async () => {
		const { workspaceId } = listMembersParamsSchemaRequest.parse(request.params)
		const members = await listWorkspaceMembers(workspaceId)
		return reply.status(200).send({ members })
	})
}

export async function removeMemberController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('remove-member', async () => {
		const { workspaceId, memberId } = removeMemberParamsSchemaRequest.parse(
			request.params
		)

		if (memberId === request.member.id) {
			return reply.status(403).send({ message: 'You cannot remove yourself' })
		}

		const workspace = await findWorkspaceById(workspaceId)
		if (workspace?.ownerId === memberId) {
			return reply.status(403).send({ message: 'You cannot remove the workspace owner' })
		}

		const deleted = await deleteMembership(workspaceId, memberId)
		if (!deleted) {
			return reply.status(404).send({ message: 'Membership not found' })
		}
		return reply.status(200).send({ message: 'Member removed.' })
	})
}

export async function getWorkspaceController(
	request: FastifyRequest,
	reply: FastifyReply
) {
	return withSpan('get-workspace', async () => {
		const { id } = getWorkspaceQuerySchemaRequest.parse(request.query)

		const workspace = await getWorkspace(id)

		if (workspace instanceof DomainError)
			return replyWithError(reply, workspace)

		return reply.status(200).send({ workspace })
	})
}
