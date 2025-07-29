import { DomainError } from './domain-error'

export class CannotCreateMembershipAlreadyExists extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Cannot create membership because it already exists', 422)
  }
}
