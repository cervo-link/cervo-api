import { DomainError } from './domain-error'

export class MembershipNotFound extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Membership not found', 404)
  }
}
