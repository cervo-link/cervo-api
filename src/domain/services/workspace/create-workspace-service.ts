import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

export async function createWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  const tracer = trace.getTracer('create-workspace')

  return tracer.startActiveSpan('create-workspace-service', async span => {
    const result = await insertWorkspace(workspace)
    if (result instanceof DomainError) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: result.message,
      })
      span.end()
      return result
    }

    span.end()
    return result
  })
}
