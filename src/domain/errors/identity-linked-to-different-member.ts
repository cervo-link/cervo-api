import { DomainError } from './domain-error'

export class IdentityLinkedToDifferentMember extends DomainError {
  constructor() {
    super('This identity is already linked to a different account', 422)
  }
}
