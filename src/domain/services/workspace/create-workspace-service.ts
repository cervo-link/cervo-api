import { trace } from '@opentelemetry/api'
import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import type { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

export async function createWorkspace(
  workspace: InsertWorkspace
): Promise<Workspace | DomainError> {
  const tracer = trace.getTracer('create-workspace')

  return tracer.startActiveSpan('create-workspace-service', async span => {
    const result = await insertWorkspace(workspace)
    if (!result) {
      span.end()
      return result
    }

    span.end()
    return result
  })
}
