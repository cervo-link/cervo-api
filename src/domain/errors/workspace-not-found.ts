import { DomainError } from './domain-error'

export class WorkspaceNotFound extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Workspace not found', 404)
  }
}
