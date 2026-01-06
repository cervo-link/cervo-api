import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { PlatformEnum } from '@/domain/@types/platform'
import type { Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { findByPlatformId } from '@/infra/db/repositories/workspaces-repository'

export async function getWorkspace(
  platformId: string,
  platform: PlatformEnum
): Promise<Workspace | DomainError> {
  const tracer = trace.getTracer('get-workspace')

  return tracer.startActiveSpan('get-workspace-service', async span => {
    const workspace = await findByPlatformId(platformId, platform)

    if (!workspace) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Workspace not found',
      })
      span.end()
      return new WorkspaceNotFound()
    }

    span.end()
    return workspace
  })
}
