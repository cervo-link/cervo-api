import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { WorkspaceIntegration } from '@/domain/entities/workspace-integration'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { insertWorkspaceIntegration } from '@/infra/db/repositories/workspace-integrations-repository'
import { findById } from '@/infra/db/repositories/workspaces-repository'

type CreateWorkspaceIntegrationInput = {
  workspaceId: string
  provider: string
  providerId: string
}

export async function createWorkspaceIntegration(
  input: CreateWorkspaceIntegrationInput
): Promise<WorkspaceIntegration | DomainError> {
  const tracer = trace.getTracer('create-workspace-integration')

  return tracer.startActiveSpan('create-workspace-integration-service', async span => {
    const workspace = await findById(input.workspaceId)
    if (!workspace) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Workspace not found' })
      span.end()
      return new WorkspaceNotFound()
    }

    const result = await insertWorkspaceIntegration(input)
    if (result instanceof Error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: result.message })
      span.end()
      return result
    }

    span.end()
    return result
  })
}
