import { DomainError } from './domain-error'

export class CannotCreateWorkspaceDueConstraintError extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Cannot create workspace due constraint', 422) //  Unprocessable Entity
  }
}
