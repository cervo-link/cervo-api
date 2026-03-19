import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findWorkspaceByIntegration } from '@/infra/db/repositories/workspace-integrations-repository'

export async function getWorkspaceByIntegration(
  provider: string,
  providerId: string
): Promise<Workspace | DomainError> {
  const tracer = trace.getTracer('get-workspace-by-integration')

  return tracer.startActiveSpan(
    'get-workspace-by-integration-service',
    async span => {
      const workspace = await findWorkspaceByIntegration(provider, providerId)

      if (!workspace) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Workspace not found' })
        span.end()
        return new WorkspaceNotFound()
      }

      span.end()
      return workspace
    }
  )
}
